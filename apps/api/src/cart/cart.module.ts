import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { type AppConfig } from '../config/configuration';
import { PrismaModule } from '../prisma/prisma.module';

import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      // SEC-022: RS256 — cart recovery tokens signed with private key
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        privateKey: config.get('JWT_PRIVATE_KEY', { infer: true }),
        publicKey: config.get('JWT_PUBLIC_KEY', { infer: true }),
        signOptions: { algorithm: 'RS256' },
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
