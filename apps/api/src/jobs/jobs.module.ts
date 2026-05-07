import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { type AppConfig } from '../config/configuration';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { SearchModule } from '../search/search.module';
import { StockModule } from '../stock/stock.module';

import { AbandonedCartsScheduler } from './abandoned-carts.scheduler';
import { OrdersQueueProcessor } from './check-pending-orders.processor';
import { EmailQueueProcessor } from './email-queue.processor';
import { ExpirePendingOrdersScheduler } from './expire-pending-orders.scheduler';
import { MarketingQueueProcessor } from './marketing-queue.processor';
import { ProductsQueueProcessor } from './products-queue.processor';
import { ReviewRequestScheduler } from './review-request.scheduler';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: { url: config.get('REDIS_URL', { infer: true }) },
      }),
    }),
    BullModule.registerQueue({ name: 'orders' }),
    BullModule.registerQueue({ name: 'email' }),
    BullModule.registerQueue({ name: 'marketing' }),
    BullModule.registerQueue({ name: 'products' }),
    PrismaModule,
    StockModule,
    NotificationsModule,
    SearchModule,
    PromoCodesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: { expiresIn: '7d' }, // Longer expiration for cart recovery
      }),
    }),
  ],
  providers: [
    OrdersQueueProcessor,
    EmailQueueProcessor,
    ExpirePendingOrdersScheduler,
    AbandonedCartsScheduler,
    ReviewRequestScheduler,
    MarketingQueueProcessor,
    ProductsQueueProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
