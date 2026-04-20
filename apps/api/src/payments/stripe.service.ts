import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { type AppConfig } from '../config/configuration';

@Injectable()
export class StripeService {
  // typed via inference — avoids Stripe v22 CJS namespace type issues
  public readonly client;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.client = new Stripe(config.get('STRIPE_SECRET_KEY', { infer: true }), {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  createPaymentIntent(amountCents: number, currency: string, metadata: Record<string, string>) {
    return this.client.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
    return this.client.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
