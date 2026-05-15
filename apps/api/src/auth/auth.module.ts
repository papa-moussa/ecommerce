import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { type AppConfig } from '../config/configuration';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TotpService } from './totp.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    NotificationsModule,
    PassportModule,
    // SEC-022: RS256 — sign with private key, verify with public key.
    // The private key never leaves the API; the public key is also exposed via
    // /.well-known/jwks.json so external verifiers (e.g. Next.js Edge middleware)
    // can verify tokens without needing the signing secret.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        privateKey: config.get('JWT_PRIVATE_KEY', { infer: true }),
        publicKey: config.get('JWT_PUBLIC_KEY', { infer: true }),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
        },
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TotpService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, TotpService],
})
export class AuthModule {}
