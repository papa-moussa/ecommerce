import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { type User } from '@prisma/client';
import { type Request, type Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { type AppConfig } from '../config/configuration';

import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TotpLoginDto } from './dto/totp-login.dto';
import { TotpVerifyDto } from './dto/totp-verify.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { TotpService } from './totp.service';

const REFRESH_COOKIE = 'refresh_token';
// SEC-004: lightweight session cookie read by the Next.js Edge middleware to
// verify the ADMIN role without a DB round-trip. Contains only {sub, role}
// and is signed with JWT_ACCESS_SECRET. Never used for API authentication.
const SESSION_COOKIE = 'user_session';
const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly totpService: TotpService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    this.setSessionCookie(res, user.id, user.role);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    if ('requires2FA' in result && result.requires2FA === true) {
      return { requires2FA: true, tempToken: result.tempToken, role: result.role };
    }
    if ('requires2FASetup' in result && result.requires2FASetup === true) {
      return { requires2FASetup: true, tempToken: result.tempToken, role: result.role };
    }
    const tokens = result.tokens!;
    this.setRefreshCookie(res, tokens.refreshToken);
    this.setSessionCookie(res, result.user!.id, result.user!.role);
    return { user: result.user, accessToken: tokens.accessToken };
  }

  @Public()
  // SEC-003: rate-limit refresh — prevents token-refresh brute-force / DoS
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw new UnauthorizedException('Missing refresh token');
    const { accessToken, refreshToken, user } = await this.authService.refresh(raw);
    this.setRefreshCookie(res, refreshToken);
    this.setSessionCookie(res, user.id, user.role);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (raw) await this.authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
  }

  // ---------------------------------------------------------------------------
  // Email verification
  // ---------------------------------------------------------------------------

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@CurrentUser() user: User) {
    return this.authService.resendVerification(user.id);
  }

  // ---------------------------------------------------------------------------
  // Password reset
  // ---------------------------------------------------------------------------

  @Public()
  @Throttle({ default: { ttl: 3_600_000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ---------------------------------------------------------------------------
  // 2FA TOTP
  // ---------------------------------------------------------------------------

  @Roles('ADMIN')
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  twoFaSetup(@CurrentUser() user: User) {
    return this.totpService.setup(user.id);
  }

  @Roles('ADMIN')
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  twoFaEnable(@CurrentUser() user: User, @Body() dto: TotpVerifyDto) {
    return this.totpService.enable(user.id, dto.code);
  }

  @Public()
  // SEC-003: strict rate-limit on 2FA verification — 5 attempts / minute max
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async twoFaVerify(@Body() dto: TotpLoginDto, @Res({ passthrough: true }) res: Response) {
    const { tokens, user } = await this.totpService.verifyLogin(dto.tempToken, dto.code);
    this.setRefreshCookie(res, tokens.refreshToken);
    this.setSessionCookie(res, user.id, user.role);
    return { accessToken: tokens.accessToken };
  }

  // Forced setup endpoints — authenticate via temp token (no session required)

  @Public()
  // SEC-003: limit setup-init — prevents scanning/hammering the forced-setup flow
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('2fa/setup-init')
  @HttpCode(HttpStatus.OK)
  twoFaSetupInit(@Body() body: { tempToken: string }) {
    return this.totpService.setupWithTempToken(body.tempToken);
  }

  @Public()
  // SEC-003: limit finish-setup — same as 2fa/verify, protects TOTP code brute-force
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('2fa/finish-setup')
  @HttpCode(HttpStatus.OK)
  async twoFaFinishSetup(
    @Body() body: { tempToken: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, backupCodes, user } = await this.totpService.enableWithTempToken(
      body.tempToken,
      body.code,
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    this.setSessionCookie(res, user.id, user.role);
    return { accessToken: tokens.accessToken, backupCodes };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * SEC-004: Set a lightweight signed session cookie readable by the Next.js
   * Edge middleware to verify the ADMIN role without a DB round-trip.
   * The cookie contains {sub, role} and is signed with JWT_ACCESS_SECRET.
   * It is NOT used for API authentication — the Bearer token remains the
   * authoritative credential for all API calls.
   */
  private setSessionCookie(res: Response, userId: string, role: string): void {
    const secureCookie =
      process.env['NODE_ENV'] === 'production' && process.env['COOKIE_SECURE'] !== 'false';

    const sessionToken = this.jwt.sign(
      { sub: userId, role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: '7d',
      },
    );

    res.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: secureCookie,
      maxAge: COOKIE_TTL_MS,
      path: '/',
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    // COOKIE_SECURE=false permet de désactiver le flag Secure quand le site
    // tourne en HTTP (sans HTTPS). Par défaut : true en production.
    const secureCookie =
      process.env['NODE_ENV'] === 'production' && process.env['COOKIE_SECURE'] !== 'false';

    // SEC-019: sameSite 'strict' (was 'lax') — prevents the cookie from being
    // sent on cross-site navigations. path restricted to /api/auth/refresh so
    // the token is never sent to unrelated API routes.
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: secureCookie,
      maxAge: COOKIE_TTL_MS,
      path: '/api/auth/refresh',
    });
  }
}
