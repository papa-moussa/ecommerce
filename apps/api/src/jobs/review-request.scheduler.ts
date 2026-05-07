import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ReviewRequestScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReviewRequestScheduler.name);

  constructor(@InjectQueue('marketing') private readonly marketingQueue: Queue) {}

  async onApplicationBootstrap() {
    await this.marketingQueue.add(
      'send-review-requests',
      {},
      {
        repeat: {
          pattern: '0 10 * * *', // every day at 10:00 AM
        },
      },
    );
    this.logger.log('Scheduled send-review-requests job (0 10 * * *)');
  }
}
