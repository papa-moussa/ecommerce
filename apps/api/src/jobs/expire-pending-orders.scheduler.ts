import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { type Queue } from 'bullmq';

@Injectable()
export class ExpirePendingOrdersScheduler implements OnModuleInit {
  private readonly logger = new Logger(ExpirePendingOrdersScheduler.name);

  constructor(@InjectQueue('orders') private readonly ordersQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.ordersQueue.add(
      'check-pending-orders',
      {},
      {
        repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
        jobId: 'check-pending-orders',
      },
    );

    this.logger.log('Scheduled check-pending-orders repeatable job (every 5 min)');
  }
}
