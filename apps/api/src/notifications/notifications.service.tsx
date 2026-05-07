import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Section, Text, Button } from '@react-email/components';
import { render } from '@react-email/render';
import * as React from 'react';
import { Resend } from 'resend';

import { type AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

// Templates
import { AbandonedCart1h } from './templates/AbandonedCart1h';
import { AbandonedCart24h } from './templates/AbandonedCart24h';
import { AbandonedCart72h } from './templates/AbandonedCart72h';
import { BaseLayout } from './templates/BaseLayout';
import { OrderConfirmationEmail } from './templates/OrderConfirmationEmail';
import { OrderStatusEmail } from './templates/OrderStatusEmail';
import { ReviewRequestEmail } from './templates/ReviewRequestEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    const resendKey = this.config.get('RESEND_API_KEY', { infer: true });
    if (resendKey) {
      this.resend = new Resend(resendKey);
    }
    this.fromEmail = this.config.get('SMTP_FROM', { infer: true });
  }

  private async logEmail(data: {
    to: string;
    template: string;
    userId?: string;
    orderId?: string;
    status: 'SENT' | 'FAILED';
    error?: string;
    metadata?: any;
    emailLogId?: string;
  }) {
    try {
      if (data.emailLogId) {
        await this.prisma.emailLog.update({
          where: { id: data.emailLogId },
          data: {
            status: data.status,
            error: data.error,
            metadata: data.metadata,
            sentAt: data.status === 'SENT' ? new Date() : undefined,
          },
        });
        return;
      }

      await this.prisma.emailLog.create({
        data: {
          to: data.to,
          template: data.template,
          userId: data.userId,
          orderId: data.orderId,
          status: data.status,
          error: data.error,
          metadata: data.metadata,
          sentAt: data.status === 'SENT' ? new Date() : null,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log email', err);
    }
  }

  private async send(opts: {
    to: string;
    subject: string;
    component: React.ReactElement;
    templateName: string;
    userId?: string;
    orderId?: string;
    emailLogId?: string;
  }) {
    if (!this.resend) {
      this.logger.warn(`Resend not configured. Skipping email: ${opts.subject}`);
      return;
    }

    try {
      const html = await render(opts.component);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: opts.to,
        subject: opts.subject,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      await this.logEmail({
        to: opts.to,
        template: opts.templateName,
        userId: opts.userId,
        orderId: opts.orderId,
        status: 'SENT',
        metadata: { resendId: data?.id },
        emailLogId: opts.emailLogId,
      });

      this.logger.log(`Email sent to ${opts.to} [${opts.templateName}]`);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${opts.to}`, err);
      await this.logEmail({
        to: opts.to,
        template: opts.templateName,
        userId: opts.userId,
        orderId: opts.orderId,
        status: 'FAILED',
        error: err.message,
        emailLogId: opts.emailLogId,
      });
    }
  }

  async sendAbandonedCartEmail(
    email: string,
    firstName: string,
    stage: number,
    promoCode?: string,
    cartToken?: string,
    emailLogId?: string,
  ) {
    const subjects = [
      'Vous avez oublié quelque chose ?',
      'Vos parfums favoris vous attendent !',
      'Une surprise pour vous 🎁',
    ];
    const subject = subjects[stage - 1] || 'Rappel de votre panier';

    let component: React.ReactElement;
    if (stage === 1) {
      component = React.createElement(AbandonedCart1h, { firstName, cartToken });
    } else if (stage === 2) {
      component = React.createElement(AbandonedCart24h, { firstName, cartToken });
    } else {
      component = React.createElement(AbandonedCart72h, {
        firstName,
        cartToken,
        promoCode: promoCode || 'REVIENS10',
      });
    }

    await this.send({
      to: email,
      subject,
      templateName: `abandoned_cart_${stage}h`,
      component,
      emailLogId,
    });
  }

  async sendOrderConfirmationEmail(
    to: string,
    firstName: string,
    orderId: string,
    items: Array<{ name: string; variantLabel?: string | null; qty: number; priceCents: number }>,
    totalCents: number,
    currency: string,
    userId?: string,
    emailLogId?: string,
  ) {
    const shortId = orderId.slice(-8).toUpperCase();
    await this.send({
      to,
      userId,
      orderId,
      subject: `Confirmation de votre commande #${shortId} — Maison Parfum`,
      templateName: 'order_confirmation',
      component: React.createElement(OrderConfirmationEmail, {
        firstName,
        orderId,
        items,
        totalCents,
        currency,
      }),
      emailLogId,
    });
  }

  async sendOrderStatusEmail(
    to: string,
    firstName: string,
    orderId: string,
    status: string,
    trackingNumber?: string | null,
    userId?: string,
    emailLogId?: string,
  ) {
    const shortId = orderId.slice(-8).toUpperCase();
    await this.send({
      to,
      userId,
      orderId,
      subject: `Mise à jour de votre commande #${shortId}`,
      templateName: `order_status_${status.toLowerCase()}`,
      component: React.createElement(OrderStatusEmail, {
        firstName,
        orderId,
        status,
        trackingNumber,
      }),
      emailLogId,
    });
  }

  async sendVerificationEmail(to: string, firstName: string, verifyUrl: string, userId?: string) {
    await this.send({
      to,
      userId,
      subject: 'Confirmez votre adresse e-mail — Maison Parfum',
      templateName: 'verification_email',
      component: React.createElement(BaseLayout, {
        preview: 'Bienvenue chez Maison Parfum !',
        children: React.createElement(
          Section,
          { style: { padding: '0 32px' } },
          React.createElement(
            Text,
            { style: { fontSize: '20px', fontWeight: 'bold' } },
            `Bienvenue, ${firstName} !`,
          ),
          React.createElement(
            Text,
            { style: { color: '#555' } },
            'Confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous.',
          ),
          React.createElement(
            Button,
            {
              href: verifyUrl,
              style: {
                backgroundColor: '#1a1a1a',
                borderRadius: '99px',
                color: '#f5f0e8',
                padding: '14px 28px',
                textDecoration: 'none',
              },
            },
            'Confirmer mon adresse',
          ),
        ),
      }),
    });
  }

  async sendPasswordResetEmail(to: string, firstName: string, resetUrl: string, userId?: string) {
    await this.send({
      to,
      userId,
      subject: 'Réinitialisation de votre mot de passe — Maison Parfum',
      templateName: 'password_reset',
      component: React.createElement(BaseLayout, {
        preview: 'Demande de réinitialisation de mot de passe',
        children: React.createElement(
          Section,
          { style: { padding: '0 32px' } },
          React.createElement(
            Text,
            { style: { fontSize: '20px', fontWeight: 'bold' } },
            `Bonjour ${firstName},`,
          ),
          React.createElement(
            Text,
            { style: { color: '#555' } },
            'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
          ),
          React.createElement(
            Button,
            {
              href: resetUrl,
              style: {
                backgroundColor: '#1a1a1a',
                borderRadius: '99px',
                color: '#f5f0e8',
                padding: '14px 28px',
                textDecoration: 'none',
              },
            },
            'Réinitialiser mon mot de passe',
          ),
        ),
      }),
    });
  }

  async sendWelcomeEmail(to: string, firstName: string, promoCode: string, userId?: string) {
    await this.send({
      to,
      userId,
      subject: 'Bienvenue chez Maison Parfum — Votre cadeau vous attend 🎁',
      templateName: 'welcome_email',
      component: React.createElement(WelcomeEmail, { firstName, promoCode }),
    });
  }

  async sendReviewRequestEmail(to: string, firstName: string, orderId: string, userId?: string) {
    await this.send({
      to,
      userId,
      orderId,
      subject: 'Votre avis nous intéresse — Maison Parfum ⭐',
      templateName: 'review_request',
      component: React.createElement(ReviewRequestEmail, { firstName, orderId }),
    });
  }
}
