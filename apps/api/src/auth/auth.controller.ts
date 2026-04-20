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
import { Throttle } from '@nestjs/throttler';
import { type User } from '@prisma/client';
import { type Request, type Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

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
const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly totpService: TotpService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    if (result.requires2FA === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { requires2FA: true, tempToken: (result as any).tempToken as string };
    }
    const tokens = result.tokens!;
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user: result.user, accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw new UnauthorizedException('Missing refresh token');
    const tokens = await this.authService.refresh(raw);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (raw) await this.authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE);
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
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  twoFaVerify(@Body() dto: TotpLoginDto, @Res({ passthrough: true }) res: Response) {
    return this.totpService.verifyLogin(dto.tempToken, dto.code).then((tokens) => {
      this.setRefreshCookie(res, tokens.refreshToken);
      return { accessToken: tokens.accessToken };
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env['NODE_ENV'] === 'production',
      maxAge: COOKIE_TTL_MS,
      path: '/',
    });
  }
}
