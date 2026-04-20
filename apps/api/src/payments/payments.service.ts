import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Stripe } from 'stripe';

import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly stockService: StockService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // Step 1: Verify and parse the Stripe event
    let event: Stripe.Event;
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
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.handlePaymentIntentSucceeded(paymentIntent);
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.handlePaymentIntentFailed(paymentIntent);
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

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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
      data: { status: 'SUCCEEDED', paidAt: new Date() },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
    });

    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId: payment.orderId },
      select: { productId: true, variantId: true, quantity: true },
    });

    for (const item of orderItems) {
      await this.stockService.decrementStock(item.productId, item.quantity, payment.orderId);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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
