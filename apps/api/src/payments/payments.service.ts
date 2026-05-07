import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { type EmailJobData } from '../jobs/email-queue.processor';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

import { StripeService } from './stripe.service';

type WebhookEvent = ReturnType<StripeService['constructWebhookEvent']>;
type PaymentIntent = { id: string };

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly stockService: StockService,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // Step 1: Verify and parse the Stripe event
    let event: WebhookEvent;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid webhook signature';
      throw new BadRequestException(`Webhook signature verification failed: ${message}`);
    }

    // Step 2: Idempotency check
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
      select: { id: true },
    });
    if (existing) {
      this.logger.log(`Webhook event already processed: ${event.id}`);
      return;
    }

    // Step 3: Create WebhookEvent record
    const webhookRecord = await this.prisma.webhookEvent.create({
      data: {
        provider: 'STRIPE',
        eventId: event.id,
        type: event.type,
        status: 'RECEIVED',
        payload: event as unknown as object,
      },
      select: { id: true },
    });

    // Step 4: Process event type
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as PaymentIntent;
          await this.handlePaymentIntentSucceeded(paymentIntent);
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as PaymentIntent;
          await this.handlePaymentIntentFailed(paymentIntent);
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as { payment_intent?: string };
          if (charge.payment_intent) {
            await this.handleChargeRefunded(charge.payment_intent);
          }
          break;
        }
        default: {
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
          break;
        }
      }

      await this.prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: { status: 'PROCESSED' },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook processing failed for event ${event.id}: ${errorMessage}`);

      await this.prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: { status: 'FAILED', error: errorMessage },
      });

      throw err;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, orderId: true, amountCents: true, currency: true },
    });

    if (!payment) {
      this.logger.warn(`No payment found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED', paidAt: new Date() },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
    });

    const [orderItems, order] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { orderId: payment.orderId },
        select: {
          productId: true,
          variantId: true,
          quantity: true,
          productName: true,
          variantLabel: true,
          unitPriceCents: true,
        },
      }),
      this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: {
          totalCents: true,
          currency: true,
          userId: true,
          user: { select: { email: true, firstName: true } },
        },
      }),
    ]);

    for (const item of orderItems) {
      await this.stockService.decrementStock(item.productId, item.quantity, payment.orderId);
    }

    if (order?.user) {
      const emailLog = await this.prisma.emailLog.create({
        data: {
          to: order.user.email,
          template: 'order_confirmation',
          orderId: payment.orderId,
          userId: order.userId,
          status: 'QUEUED',
        },
        select: { id: true },
      });

      await this.emailQueue.add('order_confirmation', {
        type: 'order_confirmation',
        emailLogId: emailLog.id,
        to: order.user.email,
        firstName: order.user.firstName,
        orderId: payment.orderId,
        items: orderItems.map((i) => ({
          name: i.productName,
          variantLabel: i.variantLabel,
          qty: i.quantity,
          priceCents: i.unitPriceCents,
        })),
        totalCents: order.totalCents,
        currency: order.currency,
      });
    }
  }

  private async handleChargeRefunded(stripePaymentIntentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId },
      select: { id: true, orderId: true },
    });

    if (!payment) {
      this.logger.warn(`No payment found for refunded charge PI: ${stripePaymentIntentId}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'REFUNDED' },
    });

    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId: payment.orderId },
      select: { productId: true, variantId: true, quantity: true },
    });

    for (const item of orderItems) {
      await this.stockService.releaseStock(item.productId, item.quantity, payment.orderId);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, orderId: true },
    });

    if (!payment) {
      this.logger.warn(`No payment found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'CANCELLED' },
    });

    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId: payment.orderId },
      select: { productId: true, variantId: true, quantity: true },
    });

    for (const item of orderItems) {
      await this.stockService.releaseStock(item.productId, item.quantity, payment.orderId);
    }
  }
}
