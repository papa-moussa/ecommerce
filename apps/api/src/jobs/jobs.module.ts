import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type AppConfig } from '../config/configuration';
import { PrismaModule } from '../prisma/prisma.module';
import { StockModule } from '../stock/stock.module';

import { OrdersQueueProcessor } from './check-pending-orders.processor';
import { ExpirePendingOrdersScheduler } from './expire-pending-orders.scheduler';

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
    PrismaModule,
    StockModule,
  ],
  providers: [OrdersQueueProcessor, ExpirePendingOrdersScheduler],
  exports: [BullModule],
})
export class JobsModule {}
