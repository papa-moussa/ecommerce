import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  sku: true,
  brand: true,
  name: true,
  priceCents: true,
  currency: true,
  stock: true,
  stockStatus: true,
  isFeatured: true,
  gender: true,
  category: { select: { id: true, slug: true, name: true } },
  images: {
    where: { isMain: true },
    select: { url: true, alt: true },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      select: {
        product: { select: PRODUCT_CARD_SELECT },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((i) => i.product);
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException(`Product "${productId}" not found`);

    await this.prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return { productId, wishlisted: true };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.wishlist.deleteMany({ where: { userId, productId } });
  }

  async getWishlistedIds(userId: string): Promise<string[]> {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }
}
