import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { buildLoggerOptions } from './common/logger/logger.config';
import { type AppConfig, configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        buildLoggerOptions({
          NODE_ENV: config.get('NODE_ENV', { infer: true }),
          PORT: config.get('PORT', { infer: true }),
          API_PREFIX: config.get('API_PREFIX', { infer: true }),
          CORS_ORIGIN: config.get('CORS_ORIGIN', { infer: true }),
          DATABASE_URL: config.get('DATABASE_URL', { infer: true }),
          REDIS_URL: config.get('REDIS_URL', { infer: true }),
          JWT_ACCESS_SECRET: config.get('JWT_ACCESS_SECRET', { infer: true }),
          JWT_REFRESH_SECRET: config.get('JWT_REFRESH_SECRET', { infer: true }),
          JWT_ACCESS_EXPIRES_IN: config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
          JWT_REFRESH_EXPIRES_IN: config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
          LOG_LEVEL: config.get('LOG_LEVEL', { infer: true }),
          SENTRY_DSN: config.get('SENTRY_DSN', { infer: true }),
          SENTRY_ENVIRONMENT: config.get('SENTRY_ENVIRONMENT', { infer: true }),
          SENTRY_TRACES_SAMPLE_RATE: config.get('SENTRY_TRACES_SAMPLE_RATE', { infer: true }),
        }),
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
