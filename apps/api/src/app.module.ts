import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { ChatbaseModule } from './chatbase/chatbase.module';
import { CacheModule } from './common/cache/cache.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { buildLoggerOptions } from './common/logger/logger.config';
import { ThrottlerStorageRedisService } from './common/services/throttler-storage-redis.service';
import { type AppConfig, configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { QuizModule } from './quiz/quiz.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { ShippingModule } from './shipping/shipping.module';
import { StockModule } from './stock/stock.module';
import { UsersModule } from './users/users.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        throttlers: [{ name: 'global', ttl: 60_000, limit: 60 }],
        storage: new ThrottlerStorageRedisService(config.get('REDIS_URL', { infer: true })),
      }),
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
          STRIPE_SECRET_KEY: config.get('STRIPE_SECRET_KEY', { infer: true }),
          STRIPE_WEBHOOK_SECRET: config.get('STRIPE_WEBHOOK_SECRET', { infer: true }),
          SMTP_HOST: config.get('SMTP_HOST', { infer: true }),
          SMTP_PORT: config.get('SMTP_PORT', { infer: true }),
          SMTP_SECURE: config.get('SMTP_SECURE', { infer: true }),
          SMTP_USER: config.get('SMTP_USER', { infer: true }),
          SMTP_PASS: config.get('SMTP_PASS', { infer: true }),
          SMTP_FROM: config.get('SMTP_FROM', { infer: true }),
          APP_URL: config.get('APP_URL', { infer: true }),
          LOG_LEVEL: config.get('LOG_LEVEL', { infer: true }),
          SENTRY_DSN: config.get('SENTRY_DSN', { infer: true }),
          SENTRY_ENVIRONMENT: config.get('SENTRY_ENVIRONMENT', { infer: true }),
          SENTRY_TRACES_SAMPLE_RATE: config.get('SENTRY_TRACES_SAMPLE_RATE', { infer: true }),
          CLOUDINARY_CLOUD_NAME: config.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
          CLOUDINARY_API_KEY: config.get('CLOUDINARY_API_KEY', { infer: true }),
          CLOUDINARY_API_SECRET: config.get('CLOUDINARY_API_SECRET', { infer: true }),
          RESEND_API_KEY: config.get('RESEND_API_KEY', { infer: true }),
          ALGOLIA_APP_ID: config.get('ALGOLIA_APP_ID', { infer: true }),
          ALGOLIA_API_KEY: config.get('ALGOLIA_API_KEY', { infer: true }),
          ALGOLIA_SEARCH_KEY: config.get('ALGOLIA_SEARCH_KEY', { infer: true }),
          TWILIO_ACCOUNT_SID: config.get('TWILIO_ACCOUNT_SID', { infer: true }),
          TWILIO_AUTH_TOKEN: config.get('TWILIO_AUTH_TOKEN', { infer: true }),
          TWILIO_WHATSAPP_FROM: config.get('TWILIO_WHATSAPP_FROM', { infer: true }),
          CHATBASE_SYNC_SECRET: config.get('CHATBASE_SYNC_SECRET', { infer: true }),
        }),
    }),
    PrismaModule,
    SearchModule,
    HealthModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    StockModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    JobsModule,
    AdminModule,
    ReviewsModule,
    WishlistModule,
    PromoCodesModule,
    QuizModule,
    ShippingModule,
    CacheModule,
    ChatbaseModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard }],
})
export class AppModule {}
