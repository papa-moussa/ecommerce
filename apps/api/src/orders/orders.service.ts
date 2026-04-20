import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type Order, type OrderItem, type Payment } from '@prisma/client';

import { StripeService } from '../payments/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

import { type CreateOrderDto } from './dto/create-order.dto';

export interface CreateOrderResult {
  orderId: string;
  clientSecret: string;
}

type OrderWithDetails = Order & {
  items: OrderItem[];
  payments: Pick<Payment, 'id' | 'provider' | 'status' | 'amountCents' | 'currency' | 'paidAt'>[];
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly stripeService: StripeService,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<CreateOrderResult> {
    // Step 1: Validate all items and compute prices server-side
    const lineItems: {
      productId: string;
      variantId: string | null;
      productName: string;
      variantLabel: string | null;
      unitPriceCents: number;
      quantity: number;
      totalCents: number;
      stockAvailable: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
          isActive: true,
          variants: item.variantId
            ? {
                where: { id: item.variantId },
                select: { id: true, sizeMl: true, priceCents: true, stock: true },
              }
            : false,
        },
      });

      if (!product) {
        throw new NotFoundException(`Produit introuvable: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Produit inactif: ${product.name}`);
      }

      let unitPriceCents: number;
      let stockAvailable: number;
      let variantLabel: string | null = null;

      if (item.variantId) {
        const variant = product.variants?.[0];
        if (!variant) {
          throw new NotFoundException(`Variante introuvable: ${item.variantId}`);
        }
        unitPriceCents = variant.priceCents;
        stockAvailable = variant.stock;
        variantLabel = `${variant.sizeMl}ml`;
      } else {
        unitPriceCents = product.priceCents;
        stockAvailable = product.stock;
      }

      // Step 2: Check stock
      if (stockAvailable < item.quantity) {
        throw new BadRequestException(`Produit épuisé: ${product.name}`);
      }

      lineItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        productName: product.name,
        variantLabel,
        unitPriceCents,
        quantity: item.quantity,
        totalCents: unitPriceCents * item.quantity,
        stockAvailable,
      });
    }

    // Step 3–7: Compute totals
    const subtotalCents = lineItems.reduce((sum, i) => sum + i.totalCents, 0);
    const shippingCents = 0;
    const taxCents = 0;
    const discountCents = 0;
    const totalCents = subtotalCents + shippingCents + taxCents - discountCents;
    const currency = 'eur';

    // Step 8: Prisma transaction — create Order + OrderItems + reserve stock
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          subtotalCents,
          discountCents,
          shippingCents,
          taxCents,
          totalCents,
          currency: currency.toUpperCase(),
          promoCode: dto.promoCode ?? null,
          shippingAddress: dto.shippingAddress as object,
          giftMessage: dto.giftMessage ?? null,
          items: {
            createMany: {
              data: lineItems.map((li) => ({
                productId: li.productId,
                variantId: li.variantId,
                productName: li.productName,
                variantLabel: li.variantLabel,
                unitPriceCents: li.unitPriceCents,
                quantity: li.quantity,
                totalCents: li.totalCents,
              })),
            },
          },
        },
      });

      return createdOrder;
    });

    // Reserve stock after transaction (stockService uses its own prisma instance)
    for (const li of lineItems) {
      await this.stockService.reserveStock(li.productId, li.quantity);
    }

    // Step 9: Create Stripe PaymentIntent
    const paymentIntent = await this.stripeService.createPaymentIntent(totalCents, currency, {
      orderId: order.id,
    });

    // Step 10: Create Payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'STRIPE',
        status: 'PENDING',
        amountCents: totalCents,
        currency: currency.toUpperCase(),
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
      select: { stripeClientSecret: true },
    });

    // Step 11: Return result
    return {
      orderId: order.id,
      clientSecret: payment.stripeClientSecret ?? '',
    };
  }

  async findAllForUser(userId: string): Promise<OrderWithDetails[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amountCents: true,
            currency: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, orderId: string): Promise<OrderWithDetails> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amountCents: true,
            currency: true,
            paidAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Commande introuvable: ${orderId}`);
    }

    return order;
  }
}
