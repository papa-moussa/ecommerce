import { createHash, randomBytes } from 'crypto';

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

    // Store secret (not yet enabled — user must confirm with a valid code)
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: totp.secret.base32, totpEnabled: false },
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

  async verifyLogin(tempToken: string, code: string): Promise<AuthTokens> {
    let payload: TempTokenPayload;
    try {
      payload = this.jwt.verify<TempTokenPayload>(tempToken, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
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

    return this.generateTokens(user);
  }

  // ---------------------------------------------------------------------------
  // Verify a code against a stored secret (used internally during enable)
  // ---------------------------------------------------------------------------

  verifyCode(secret: string, code: string): void {
    if (!this.isCodeValid(secret, code)) {
      throw new BadRequestException('Code TOTP invalide.');
    }
  }

  isCodeValid(secret: string, code: string): boolean {
    const totp = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 });
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
  ): Promise<{ backupCodes: string[]; tokens: AuthTokens }> {
    const payload = this.verifyTempToken(tempToken);
    const result = await this.enable(payload.sub, code);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    const tokens = await this.generateTokens(user);
    return { ...result, tokens };
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
    return this.jwt.sign(payload, { expiresIn: TEMP_TOKEN_TTL_SECONDS });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private verifyTempToken(tempToken: string): TempTokenPayload {
    try {
      return this.jwt.verify<TempTokenPayload>(tempToken, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Temp token invalide ou expiré.');
    }
  }

  // ---------------------------------------------------------------------------
  // Private

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
