import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type Cart, type CartItem, type Product, type ProductVariant } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { type SyncCartItemDto } from './dto/sync-cart.dto';

export interface ValidatedItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  productName: string;
  variantLabel: string | null;
  available: boolean;
  stockAvailable: number;
}

export interface ValidateResult {
  items: ValidatedItem[];
  subtotalCents: number;
  isValid: boolean;
  invalidItems: string[];
}

type CartWithItems = Cart & {
  items: (CartItem & {
    product: Pick<Product, 'id' | 'name' | 'priceCents' | 'stock' | 'isActive'>;
    variant: Pick<ProductVariant, 'id' | 'sizeMl' | 'priceCents' | 'stock'> | null;
  })[];
};

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async getOrCreate(userId?: string, sessionId?: string): Promise<CartWithItems> {
    const where = userId ? { userId } : { sessionId: sessionId ?? '' };

    const existing = await this.prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, priceCents: true, stock: true, isActive: true },
            },
            variant: {
              select: { id: true, sizeMl: true, priceCents: true, stock: true },
            },
          },
        },
      },
    });

    if (existing) return existing;

    return this.prisma.cart.create({
      data: {
        ...(userId ? { userId } : {}),
        ...(sessionId && !userId ? { sessionId } : {}),
        lastActivityAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, priceCents: true, stock: true, isActive: true },
            },
            variant: {
              select: { id: true, sizeMl: true, priceCents: true, stock: true },
            },
          },
        },
      },
    });
  }

  async sync(
    userId: string | undefined,
    sessionId: string | undefined,
    items: SyncCartItemDto[],
  ): Promise<Cart> {
    const cart = await this.getOrCreate(userId, sessionId);

    // Delete all existing items and recreate (replace strategy)
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Filter out qty=0 items
    const validItems = items.filter((i) => i.quantity > 0);

    if (validItems.length > 0) {
      await this.prisma.cartItem.createMany({
        data: validItems.map((item) => ({
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
      });
    }

    return this.prisma.cart.update({
      where: { id: cart.id },
      data: { lastActivityAt: new Date(), reminderStage: 0 },
    });
  }

  async validate(
    userId: string | undefined,
    sessionId: string | undefined,
  ): Promise<ValidateResult> {
    const cart = await this.getOrCreate(userId, sessionId);

    const validatedItems: ValidatedItem[] = [];
    const invalidItems: string[] = [];

    for (const item of cart.items) {
      const product = item.product;
      const variant = item.variant;

      const unitPriceCents = variant?.priceCents ?? product.priceCents;
      const stockAvailable = variant ? variant.stock : product.stock;
      const variantLabel = variant ? `${variant.sizeMl}ml` : null;
      const available = product.isActive && stockAvailable >= item.quantity;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        unitPriceCents,
        totalCents: unitPriceCents * item.quantity,
        productName: product.name,
        variantLabel,
        available,
        stockAvailable,
      });

      if (!available) {
        invalidItems.push(item.productId);
      }
    }

    const subtotalCents = validatedItems.reduce((sum, i) => sum + i.totalCents, 0);

    return {
      items: validatedItems,
      subtotalCents,
      isValid: invalidItems.length === 0,
      invalidItems,
    };
  }

  async recover(userId: string, token: string) {
    try {
      // HIGH-02 (Audit-2): pin algorithm to prevent alg:none downgrade attacks
      const payload = this.jwt.verify(token, { algorithms: ['RS256'] } as Parameters<
        typeof this.jwt.verify
      >[1]);
      const cartId = payload.cartId;

      if (!cartId) throw new BadRequestException('Token invalide');

      // Find the source cart
      const sourceCart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: true },
      });

      if (!sourceCart) throw new BadRequestException('Panier introuvable');

      // Merge items into user's current cart
      const targetCart = await this.getOrCreate(userId);

      for (const item of sourceCart.items) {
        await this.prisma.cartItem.upsert({
          where: {
            cartId_productId_variantId: {
              cartId: targetCart.id,
              productId: item.productId,
              variantId: item.variantId ?? 'default', // Using a string fallback because of @unique constraints usually needing non-null values if in compound key, or handling null specifically
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            cartId: targetCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
      }

      return this.validate(userId, undefined);
    } catch (e) {
      throw new BadRequestException('Échec de la récupération du panier');
    }
  }
}
