import { createHash, randomBytes } from 'crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { type AppConfig } from '../config/configuration';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { type PublicUser, UsersService } from '../users/users.service';

import { type ForgotPasswordDto } from './dto/forgot-password.dto';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
import { type ResetPasswordDto } from './dto/reset-password.dto';
import { type VerifyEmailDto } from './dto/verify-email.dto';
import { type JwtPayload } from './strategies/jwt.strategy';
import { TotpService } from './totp.service';

const REFRESH_TOKEN_TTL_DAYS = 7;
const EMAIL_VERIFY_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_HOURS = 1;
const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly notifications: NotificationsService,
    private readonly totp: TotpService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user as User);

    // Send verification email (non-blocking — swallowed on error)
    void this.sendVerificationEmail(user as User);

    // Send welcome email (non-blocking)
    void this.notifications.sendWelcomeEmail(user.email, user.firstName, 'WELCOME10', user.id);

    return { user, tokens };
  }

  async login(
    dto: LoginDto,
  ): Promise<
    | { user: PublicUser; tokens: AuthTokens; requires2FA?: never; requires2FASetup?: never }
    | { requires2FA: true; tempToken: string; role: string; user?: never; tokens?: never }
    | { requires2FASetup: true; tempToken: string; role: string; user?: never; tokens?: never }
  > {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.blocked) throw new UnauthorizedException('Compte bloqué. Contactez le support.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.role === 'ADMIN') {
      const tempToken = this.totp.issueTempToken(user);
      if (user.totpEnabled) {
        // Step-2: verify TOTP code
        return { requires2FA: true, tempToken, role: user.role };
      }
      // ADMIN without TOTP configured → force setup before granting access
      return { requires2FASetup: true, tempToken, role: user.role };
    }

    const { passwordHash: _ph, ...publicUser } = user;
    const tokens = await this.generateTokens(user);
    return { user: publicUser, tokens };
  }

  async refresh(rawToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user);
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // Email verification
  // ---------------------------------------------------------------------------

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const tokenHash = hashToken(dto.token);
    const record = await this.prisma.emailVerification.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de vérification invalide ou expiré.');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
    ]);

    return { message: 'Adresse e-mail confirmée.' };
  }

  async resendVerification(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.emailVerified) {
      return { message: 'Adresse déjà vérifiée.' };
    }
    void this.sendVerificationEmail(user);
    return { message: 'E-mail de vérification renvoyé.' };
  }

  // ---------------------------------------------------------------------------
  // Password reset
  // ---------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    // Always return the same response to avoid user enumeration
    const message = 'Si un compte existe pour cet e-mail, un lien a été envoyé.';

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return { message };

    // Invalidate any previous non-expired, unused tokens for this user
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TTL_HOURS);

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${this.config.get('APP_URL', { infer: true })}/reset-password?token=${rawToken}`;
    await this.notifications.sendPasswordResetEmail(user.email, user.firstName, resetUrl, user.id);

    return { message };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = hashToken(dto.token);
    const record = await this.prisma.passwordReset.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      // Mark reset token as used
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Update password
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      // Revoke all refresh tokens (security: invalidate all sessions)
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Mot de passe mis à jour. Veuillez vous reconnecter.' };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);

    const rawRefresh = randomBytes(64).toString('hex');
    const tokenHash = hashToken(rawRefresh);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFY_TTL_HOURS);

    await this.prisma.emailVerification.upsert({
      where: { userId: user.id },
      update: { tokenHash: hashToken(token), expiresAt },
      create: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    });

    const verifyUrl = `${this.config.get('APP_URL', { infer: true })}/verify-email?token=${token}`;
    await this.notifications.sendVerificationEmail(user.email, user.firstName, verifyUrl, user.id);
  }
}
