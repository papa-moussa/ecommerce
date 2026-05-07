import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Job } from 'bullmq';

import { NotificationsService } from '../notifications/notifications.service';
import { TwilioService } from '../notifications/twilio.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';

@Processor('marketing')
export class MarketingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MarketingQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly promoCodes: PromoCodesService,
    private readonly jwt: JwtService,
    private readonly twilio: TwilioService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'check-abandoned-carts') {
      await this.processAbandonedCarts();
    } else if (job.name === 'send-review-requests') {
      await this.processReviewRequests();
    }
  }

  private async processReviewRequests() {
    this.logger.log('Sending review requests for orders delivered 7 days ago...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Simplification: we check for orders with status DELIVERED and updatedAt around 7 days ago
    // In a real scenario, we'd check a dedicated 'deliveredAt' field or audit logs
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: {
          gte: new Date(sevenDaysAgo.getTime() - 24 * 60 * 60 * 1000), // delivered in the last 24h of 7 days ago
          lte: sevenDaysAgo,
        },
      },
      include: { user: true },
    });

    for (const order of orders) {
      if (order.user) {
        await this.notifications.sendReviewRequestEmail(
          order.user.email,
          order.user.firstName,
          order.id,
          order.userId ?? undefined,
        );
        this.logger.debug(`Review request sent for order ${order.id}`);
      }
    }
  }

  private async processAbandonedCarts() {
    this.logger.log('Checking for abandoned carts...');
    const now = new Date();

    // Find carts that belong to a user, with optIn=true, and haven't been touched in a while
    const carts = await this.prisma.cart.findMany({
      where: {
        userId: { not: null },
        user: { marketingOptIn: true },
        items: { some: {} }, // must have items
        // We handle stages 0, 1, 2
        reminderStage: { in: [0, 1, 2] },
      },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    for (const cart of carts) {
      if (!cart.user) continue;

      const hoursSinceLastActivity =
        (now.getTime() - cart.lastActivityAt.getTime()) / (1000 * 60 * 60);

      // Stage 1 (1h - 2h)
      if (cart.reminderStage === 0 && hoursSinceLastActivity >= 1 && hoursSinceLastActivity < 2) {
        const token = this.jwt.sign({ cartId: cart.id, userId: cart.userId ?? undefined });
        await this.notifications.sendAbandonedCartEmail(
          cart.user.email,
          cart.user.firstName,
          1,
          undefined,
          token,
        );
        await this.prisma.cart.update({ where: { id: cart.id }, data: { reminderStage: 1 } });
      }

      // Stage 2 (24h - 25h)
      else if (
        cart.reminderStage === 1 &&
        hoursSinceLastActivity >= 24 &&
        hoursSinceLastActivity < 25
      ) {
        const token = this.jwt.sign({ cartId: cart.id, userId: cart.userId ?? undefined });
        await this.notifications.sendAbandonedCartEmail(
          cart.user.email,
          cart.user.firstName,
          2,
          undefined,
          token,
        );

        if (cart.user.phone) {
          await this.twilio.sendWhatsApp(
            cart.user.phone,
            `Bonjour ${cart.user.firstName}, c'est Maison Parfum ! Vos articles favoris vous attendent encore. Retrouvez votre panier ici : http://localhost:3002/checkout?token=${token}`,
          );
        }

        await this.prisma.cart.update({ where: { id: cart.id }, data: { reminderStage: 2 } });
      }

      // Stage 3 (72h - 73h)
      else if (
        cart.reminderStage === 2 &&
        hoursSinceLastActivity >= 72 &&
        hoursSinceLastActivity < 73
      ) {
        // Generate a 10% promo code
        const code = `COMEBACK${cart.userId!.substring(cart.userId!.length - 4).toUpperCase()}`;
        try {
          await this.promoCodes.create({
            code,
            type: 'PERCENTAGE',
            value: 10,
            maxUses: 1,
            maxUsesPerUser: 1,
            validFrom: new Date().toISOString(),
            validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          });
        } catch (e) {
          // ignore if exists
        }

        const token = this.jwt.sign({ cartId: cart.id, userId: cart.userId ?? undefined });
        await this.notifications.sendAbandonedCartEmail(
          cart.user.email,
          cart.user.firstName,
          3,
          code,
          token,
        );
        await this.prisma.cart.update({ where: { id: cart.id }, data: { reminderStage: 3 } });
      }
    }
  }
}
