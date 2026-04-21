import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { type ListProductsDto, type ProductSort } from './dto/list-products.dto';

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

const PRODUCT_DETAIL_SELECT = {
  ...PRODUCT_CARD_SELECT,
  description: true,
  storyTelling: true,
  topNotes: true,
  heartNotes: true,
  baseNotes: true,
  lowStockThreshold: true,
  createdAt: true,
  images: {
    select: { id: true, url: true, alt: true, position: true, isMain: true },
    orderBy: { position: 'asc' as const },
  },
  variants: {
    select: { id: true, sizeMl: true, priceCents: true, stock: true, sku: true },
    orderBy: { sizeMl: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

function buildOrderBy(sort?: ProductSort): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':
      return { priceCents: 'asc' };
    case 'price_desc':
      return { priceCents: 'desc' };
    case 'featured':
      return { isFeatured: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListProductsDto) {
    const limit = dto.limit ?? 20;
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(dto.category && { category: { slug: dto.category } }),
      ...(dto.gender && { gender: dto.gender }),
      ...(dto.minPrice !== undefined || dto.maxPrice !== undefined
        ? { priceCents: { gte: dto.minPrice, lte: dto.maxPrice } }
        : {}),
    };

    const items = await this.prisma.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy: buildOrderBy(dto.sort),
      take: limit + 1,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
    });

    const hasNext = items.length > limit;
    const data = hasNext ? items.slice(0, limit) : items;
    const nextCursor = hasNext ? data[data.length - 1]?.id : null;

    return { data, nextCursor };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: PRODUCT_DETAIL_SELECT,
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
  }

  findFeatured() {
    return this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      select: PRODUCT_CARD_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  }

  async findBestsellers() {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const top = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { in: ['PAID', 'DELIVERED'] },
          createdAt: { gte: since },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    });

    if (top.length === 0) return [];

    const productIds = top.map((t) => t.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: PRODUCT_CARD_SELECT,
    });

    // Preserve ranking order
    return productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }

  async findRelated(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);

    return this.prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true, id: { not: id } },
      select: PRODUCT_CARD_SELECT,
      take: 4,
    });
  }
}
