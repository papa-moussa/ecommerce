
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { type AppConfig } from '../config/configuration';

@Injectable()
export class StripeService {
  public readonly client: Stripe;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.client = new Stripe(config.get('STRIPE_SECRET_KEY', { infer: true }), {
      apiVersion: '2025-03-31.basil',
    });
  }

  createPaymentIntent(
    amountCents: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    return this.client.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
    return this.client.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
