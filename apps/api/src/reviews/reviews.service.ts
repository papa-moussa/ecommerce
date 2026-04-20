import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { sanitizeText } from '../common/utils/sanitize';
import { PrismaService } from '../prisma/prisma.service';

import { type CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(productId: string, userId: string, dto: CreateReviewDto) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable.');

    // Verify user has a DELIVERED order containing this product
    const deliveredItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: 'DELIVERED' },
      },
    });
    if (!deliveredItem) {
      throw new ForbiddenException('Vous devez avoir reçu ce produit pour laisser un avis.');
    }

    // Check uniqueness
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new BadRequestException('Vous avez déjà laissé un avis pour ce produit.');

    return this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        comment: sanitizeText(dto.comment),
      },
    });
  }

  async listProductReviews(productId: string, page = 1) {
    const take = 10;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isApproved: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.review.count({ where: { productId, isApproved: true } }),
    ]);

    const ratingAgg = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    return { items, total, page, pages: Math.ceil(total / take), avgRating: ratingAgg._avg.rating };
  }

  // Admin moderation
  async listPendingReviews(page = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { isApproved: false },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where: { isApproved: false } }),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async approveReview(id: string) {
    return this.prisma.review.update({ where: { id }, data: { isApproved: true } });
  }

  async deleteReview(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
