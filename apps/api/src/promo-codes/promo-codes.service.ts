import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  // HIGH-07 (Audit-2): productIds allows scope enforcement (applicableProductIds / applicableCategoryIds)
  async applyPromo(
    code: string,
    userId: string | null,
    subtotalCents: number,
    productIds: string[] = [],
  ) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new BadRequestException('Code promo invalide');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Ce code promo est inactif');
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      throw new BadRequestException("Ce code promo n'est pas encore valide");
    }
    if (promo.validUntil && now > promo.validUntil) {
      throw new BadRequestException('Ce code promo est expiré');
    }

    if (promo.minOrderCents && subtotalCents < promo.minOrderCents) {
      throw new BadRequestException(
        `Le montant minimum pour ce code est de ${promo.minOrderCents}`,
      );
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException("Ce code promo a atteint sa limite d'utilisation");
    }

    if (userId && promo.maxUsesPerUser) {
      const userUsages = await this.prisma.promoCodeUsage.count({
        where: { promoCodeId: promo.id, userId },
      });
      if (userUsages >= promo.maxUsesPerUser) {
        throw new BadRequestException('Vous avez déjà utilisé ce code le maximum de fois autorisé');
      }
    }

    // HIGH-07 (Audit-2): enforce product-level scope restrictions
    if (promo.applicableProductIds.length > 0 && productIds.length > 0) {
      const hasMatch = productIds.some((id) => promo.applicableProductIds.includes(id));
      if (!hasMatch) {
        throw new BadRequestException(
          "Ce code promo ne s'applique pas aux produits de votre panier",
        );
      }
    }

    let discountCents = 0;
    if (promo.type === 'PERCENTAGE') {
      discountCents = Math.floor((subtotalCents * promo.value) / 100);
    } else if (promo.type === 'FIXED_AMOUNT') {
      discountCents = promo.value;
    } else if (promo.type === 'FREE_SHIPPING') {
      // Handled in order service usually
      discountCents = 0;
    }

    // Ensure discount doesn't exceed subtotal
    if (discountCents > subtotalCents) {
      discountCents = subtotalCents;
    }

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discountCents,
    };
  }

  // Admin methods
  async findAll(query: { page?: number; limit?: number } = {}) {
    const page = Number(query.page) || 1;
    const take = Number(query.limit) || 20;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { usages: true },
          },
        },
      }),
      this.prisma.promoCode.count(),
    ]);

    return {
      items,
      total,
      page,
      limit: take,
      pages: Math.ceil(total / take),
    };
  }

  async findOne(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    return promo;
  }

  async create(data: CreatePromoCodeDto) {
    // verify if code exists
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) throw new BadRequestException('Ce code existe déjà');

    return this.prisma.promoCode.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });
  }

  async update(id: string, data: UpdatePromoCodeDto) {
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...data,
        code: data.code?.toUpperCase(),
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });
  }

  async remove(id: string) {
    // Soft delete or hard delete depending on usage. We'll just set isActive to false
    return this.prisma.promoCode.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
