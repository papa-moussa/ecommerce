import { Module } from '@nestjs/common';

import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { StockModule } from '../stock/stock.module';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, StockModule, PaymentsModule, PromoCodesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
