import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { type Job } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

const PENDING_ORDER_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

@Processor('orders')
export class OrdersQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'check-pending-orders') {
      await this.expirePendingOrders();
    }
  }

  private async expirePendingOrders(): Promise<void> {
    const cutoff = new Date(Date.now() - PENDING_ORDER_EXPIRY_MS);

    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: 'ONLINE',
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        items: {
          select: { productId: true, variantId: true, quantity: true },
        },
      },
    });

    if (staleOrders.length === 0) {
      this.logger.debug('No stale pending orders found');
      return;
    }

    this.logger.log(`Expiring ${staleOrders.length} stale pending order(s)`);

    for (const order of staleOrders) {
      try {
        // Update order status to CANCELLED
        await this.prisma.order.update({
          where: { id: order.id, status: 'PENDING' }, // optimistic guard
          data: { status: 'CANCELLED' },
        });

        // Release reserved stock for each item
        for (const item of order.items) {
          await this.stockService.releaseStock(item.productId, item.quantity, order.id);
        }

        this.logger.log(`Order ${order.id} expired and stock released`);
      } catch (err) {
        // Order may have been updated concurrently; log and continue
        this.logger.warn(`Failed to expire order ${order.id}: ${String(err)}`);
      }
    }
  }
}
