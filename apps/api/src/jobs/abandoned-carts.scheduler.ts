import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class AbandonedCartsScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(AbandonedCartsScheduler.name);

  constructor(@InjectQueue('marketing') private readonly marketingQueue: Queue) {}

  async onApplicationBootstrap() {
    await this.marketingQueue.add(
      'check-abandoned-carts',
      {},
      {
        repeat: {
          pattern: '*/15 * * * *', // every 15 minutes
        },
      },
    );
    this.logger.log('Scheduled check-abandoned-carts job (*/15 * * * *)');
  }
}
