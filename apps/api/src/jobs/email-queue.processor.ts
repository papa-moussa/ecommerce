import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface OrderConfirmationJobData {
  type: 'order_confirmation';
  emailLogId: string;
  to: string;
  firstName: string;
  orderId: string;
  items: Array<{ name: string; variantLabel?: string | null; qty: number; priceCents: number }>;
  totalCents: number;
  currency: string;
}

export interface OrderStatusJobData {
  type: 'order_status';
  emailLogId: string;
  to: string;
  firstName: string;
  orderId: string;
  status: string;
  trackingNumber?: string | null;
}

export type EmailJobData = OrderConfirmationJobData | OrderStatusJobData;

@Processor('email')
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { data } = job;
    this.logger.log(`Processing email job: ${data.type} for ${data.to}`);

    try {
      if (data.type === 'order_confirmation') {
        await this.notifications.sendOrderConfirmationEmail(
          data.to,
          data.firstName,
          data.orderId,
          data.items,
          data.totalCents,
          data.currency,
          undefined, // userId
          data.emailLogId,
        );
      } else if (data.type === 'order_status') {
        await this.notifications.sendOrderStatusEmail(
          data.to,
          data.firstName,
          data.orderId,
          data.status,
          data.trackingNumber,
          undefined, // userId
          data.emailLogId,
        );
      }

      this.logger.log(`Email sent successfully: ${data.type} to ${data.to}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Email job failed: ${data.type} to ${data.to} — ${error}`);

      await this.prisma.emailLog
        .update({
          where: { id: data.emailLogId },
          data: { status: 'FAILED', error },
        })
        .catch(() => {});

      throw err;
    }
  }
}
