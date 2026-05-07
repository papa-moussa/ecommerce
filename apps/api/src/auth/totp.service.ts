import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { TOTP, Secret } from 'otpauth';
import * as QRCode from 'qrcode';

import { type AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

import { type AuthTokens } from './auth.service';
import { type JwtPayload } from './strategies/jwt.strategy';

const BACKUP_CODE_COUNT = 5;
const BCRYPT_ROUNDS = 12;
const TEMP_TOKEN_TTL_SECONDS = 300; // 5 min

export interface TempTokenPayload {
  sub: string;
  email: string;
  role: Role;
  twofa: true;
}

@Injectable()
export class TotpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // ---------------------------------------------------------------------------
  // Setup — generate secret + QR code URL
  // ---------------------------------------------------------------------------

  async setup(userId: string): Promise<{ otpauthUrl: string; qrDataUrl: string; secret: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const totp = new TOTP({
      issuer: 'Maison Parfum',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new Secret(),
    });

    const otpauthUrl = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret encrypted (not yet enabled — user must confirm with a valid code)
    // SEC-013: encrypt before persisting so a DB dump cannot clone authenticators.
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: this.encryptSecret(totp.secret.base32), totpEnabled: false },
    });

    return { otpauthUrl, qrDataUrl, secret: totp.secret.base32 };
  }

  // ---------------------------------------------------------------------------
  // Enable — confirm setup with a valid TOTP code
  // ---------------------------------------------------------------------------

  async enable(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpSecret) throw new BadRequestException('TOTP setup not initiated.');
    if (user.totpEnabled) throw new BadRequestException('TOTP already enabled.');

    this.verifyCode(user.totpSecret, code);

    const rawCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      randomBytes(6).toString('hex').toUpperCase(),
    );
    const hashedCodes = await Promise.all(rawCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)));

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, backupCodes: hashedCodes },
    });

    return { backupCodes: rawCodes };
  }

  // ---------------------------------------------------------------------------
  // Login step-2 — verify code and issue real tokens
  // ---------------------------------------------------------------------------

  async verifyLogin(
    tempToken: string,
    code: string,
  ): Promise<{ tokens: AuthTokens; user: Pick<User, 'id' | 'role'> }> {
    let payload: TempTokenPayload;
    try {
      // SEC-002: verify with JWT_TEMP_SECRET — a secret entirely distinct from
      // JWT_ACCESS_SECRET so a temp token is cryptographically rejected by the
      // main JwtStrategy even if the twofa claim check were bypassed.
      payload = this.jwt.verify<TempTokenPayload>(tempToken, {
        secret: this.config.get('JWT_TEMP_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Temp token invalide ou expiré.');
    }

    if (!payload.twofa) throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.totpEnabled || !user.totpSecret) throw new UnauthorizedException();

    // Try TOTP code first, then backup codes
    const validTotp = this.isCodeValid(user.totpSecret, code);
    if (!validTotp) {
      const used = await this.tryBackupCode(user, code);
      if (!used) throw new UnauthorizedException('Code invalide.');
    }

    const tokens = await this.generateTokens(user);
    // SEC-004: return user so controller can set the user_session cookie
    return { tokens, user: { id: user.id, role: user.role } };
  }

  // ---------------------------------------------------------------------------
  // Verify a code against a stored secret (used internally during enable)
  // ---------------------------------------------------------------------------

  verifyCode(secret: string, code: string): void {
    if (!this.isCodeValid(secret, code)) {
      throw new BadRequestException('Code TOTP invalide.');
    }
  }

  isCodeValid(encryptedOrPlainSecret: string, code: string): boolean {
    // SEC-013: decrypt if the stored value is in the encrypted `iv:enc:tag` format.
    // Plaintext base32 strings (legacy/migration) contain no colons and are used as-is.
    const plainSecret = encryptedOrPlainSecret.includes(':')
      ? this.decryptSecret(encryptedOrPlainSecret)
      : encryptedOrPlainSecret;
    const totp = new TOTP({ secret: Secret.fromBase32(plainSecret), digits: 6, period: 30 });
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  // ---------------------------------------------------------------------------
  // Forced setup flow — used when ADMIN has no TOTP yet (temp token auth)
  // ---------------------------------------------------------------------------

  async setupWithTempToken(
    tempToken: string,
  ): Promise<{ otpauthUrl: string; qrDataUrl: string; secret: string }> {
    const payload = this.verifyTempToken(tempToken);
    return this.setup(payload.sub);
  }

  async enableWithTempToken(
    tempToken: string,
    code: string,
  ): Promise<{ backupCodes: string[]; tokens: AuthTokens; user: Pick<User, 'id' | 'role'> }> {
    const payload = this.verifyTempToken(tempToken);
    const result = await this.enable(payload.sub, code);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    const tokens = await this.generateTokens(user);
    // SEC-004: return user so controller can set the user_session cookie
    return { ...result, tokens, user: { id: user.id, role: user.role } };
  }

  // ---------------------------------------------------------------------------
  // Issue a short-lived temp token (for 2-step login)
  // ---------------------------------------------------------------------------

  issueTempToken(user: User): string {
    const payload: TempTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      twofa: true,
    };
    // SEC-002: sign with JWT_TEMP_SECRET, not JWT_ACCESS_SECRET.
    // This makes the temp token cryptographically incompatible with the
    // access token verified by JwtStrategy — a tempToken presented to any
    // protected endpoint will always fail signature verification.
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_TEMP_SECRET', { infer: true }),
      expiresIn: TEMP_TOKEN_TTL_SECONDS,
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private verifyTempToken(tempToken: string): TempTokenPayload {
    try {
      // SEC-002: use JWT_TEMP_SECRET (distinct from JWT_ACCESS_SECRET)
      const payload = this.jwt.verify<TempTokenPayload>(tempToken, {
        secret: this.config.get('JWT_TEMP_SECRET', { infer: true }),
      });
      if (!payload.twofa) throw new UnauthorizedException();
      return payload;
    } catch {
      throw new UnauthorizedException('Temp token invalide ou expiré.');
    }
  }

  // ---------------------------------------------------------------------------
  // Private

  // ---------------------------------------------------------------------------
  // AES-256-GCM helpers — SEC-013
  // ---------------------------------------------------------------------------

  /**
   * Encrypts a plaintext TOTP secret (base32) using AES-256-GCM.
   * Output format: `<ivHex>:<ciphertextHex>:<authTagHex>`
   */
  private encryptSecret(plaintext: string): string {
    const key = Buffer.from(this.config.get('APP_ENCRYPTION_KEY', { infer: true }), 'hex');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted TOTP secret.
   * Throws if the auth tag is invalid (tamper detection).
   */
  private decryptSecret(ciphertext: string): string {
    const key = Buffer.from(this.config.get('APP_ENCRYPTION_KEY', { infer: true }), 'hex');
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted secret format');
    const [ivHex, encHex, tagHex] = parts as [string, string, string];
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8');
  }

  private async tryBackupCode(user: User, rawCode: string): Promise<boolean> {
    for (let i = 0; i < user.backupCodes.length; i++) {
      const match = await bcrypt.compare(rawCode.toUpperCase(), user.backupCodes[i]!);
      if (match) {
        const remaining = user.backupCodes.filter((_, idx) => idx !== i);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { backupCodes: remaining },
        });
        return true;
      }
    }
    return false;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);

    const rawRefresh = randomBytes(64).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    return { accessToken, refreshToken: rawRefresh };
  }
}
