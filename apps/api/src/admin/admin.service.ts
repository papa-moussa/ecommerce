import { createHmac } from 'crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';

import { type AppConfig } from '../config/configuration';
import { StripeService } from '../payments/stripe.service';
import { PrismaService } from '../prisma/prisma.service';

import { type AddProductImageDto } from './dto/add-product-image.dto';
import { type CreateProductDto } from './dto/create-product.dto';
import { type RefundOrderDto } from './dto/refund-order.dto';
import { type StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { type UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { type UpdateProductDto } from './dto/update-product.dto';
import { type UpdateUserDto } from './dto/update-user.dto';

// Valid transitions: key → allowed next statuses
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [],
  PAID: [OrderStatus.PROCESSING],
  PROCESSING: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly stripeService: StripeService,
  ) {}

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  async getMetricsOverview(period: '7d' | '30d' | '90d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [revenue, orderCount, topProducts, lowStock] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: from },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: from } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: {
            createdAt: { gte: from },
            status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          },
        },
        _sum: { quantity: true, totalCents: true },
        orderBy: { _sum: { totalCents: 'desc' } },
        take: 10,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stockStatus: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
        select: { id: true, name: true, stock: true, lowStockThreshold: true, stockStatus: true },
      }),
    ]);

    const totalRevenue = revenue._sum.totalCents ?? 0;
    const paidCount = revenue._count;
    const avgCart = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    return {
      totalRevenueCents: totalRevenue,
      orderCount,
      avgCartCents: avgCart,
      topProducts,
      lowStock,
    };
  }

  async getMetricsTimeseries(metric: string, period: '7d' | '30d' | '90d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: from },
      },
      select: { createdAt: true, totalCents: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const map = new Map<string, { date: string; value: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const existing = map.get(key) ?? { date: key, value: 0 };
      existing.value += metric === 'revenue' ? o.totalCents : 1;
      map.set(key, existing);
    }

    return Array.from(map.values());
  }

  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true, stockStatus: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        stockStatus: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Cloudinary upload signing
  // ---------------------------------------------------------------------------

  signUpload(folder: string) {
    const allowedFolders = ['products', 'categories'];
    if (!allowedFolders.includes(folder)) {
      throw new BadRequestException('Dossier non autorisé.');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = this.config.get('CLOUDINARY_API_KEY', { infer: true });

    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHmac('sha1', apiSecret).update(toSign).digest('hex');

    return { signature, timestamp, apiKey, cloudName, folder };
  }

  // ---------------------------------------------------------------------------
  // Products CRUD
  // ---------------------------------------------------------------------------

  async createProduct(dto: CreateProductDto, adminId: string) {
    const product = await this.prisma.product.create({ data: dto });
    if (dto.stock > 0) {
      await this.prisma.stockMovement.create({
        data: { productId: product.id, delta: dto.stock, reason: 'INITIAL', createdBy: adminId },
      });
    }
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.findProductOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async deleteProduct(id: string) {
    await this.findProductOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async addProductImage(productId: string, dto: AddProductImageDto) {
    await this.findProductOrThrow(productId);
    if (dto.isMain) {
      await this.prisma.productImage.updateMany({ where: { productId }, data: { isMain: false } });
    }
    return this.prisma.productImage.create({ data: { productId, ...dto } });
  }

  async reorderProductImages(productId: string, orderedIds: string[]) {
    await this.findProductOrThrow(productId);
    await Promise.all(
      orderedIds.map((imgId, i) =>
        this.prisma.productImage.update({ where: { id: imgId }, data: { position: i } }),
      ),
    );
    return { reordered: orderedIds.length };
  }

  async deleteProductImage(productId: string, imageId: string) {
    return this.prisma.productImage.delete({ where: { id: imageId, productId } });
  }

  async adjustStock(productId: string, dto: StockAdjustmentDto, adminId: string) {
    await this.findProductOrThrow(productId);
    const [movement, updated] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          productId,
          delta: dto.delta,
          reason: dto.reason,
          note: dto.note,
          createdBy: adminId,
        },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: dto.delta } },
      }),
    ]);
    // Update stockStatus post-increment
    await this.updateStockStatus(productId, updated.stock, updated.lowStockThreshold);
    return movement;
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  async listOrders(query: { status?: string; from?: string; to?: string; page?: number }) {
    const page = query.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const where = {
      ...(query.status && { status: query.status as OrderStatus }),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && { gte: new Date(query.from) }),
              ...(query.to && { lte: new Date(query.to) }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrder(id);
    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition invalide : ${order.status} → ${dto.status}. Transitions autorisées : ${allowed.join(', ') || 'aucune'}.`,
      );
    }
    if (dto.status === OrderStatus.SHIPPED && !dto.trackingNumber) {
      throw new BadRequestException('Un numéro de suivi est requis pour passer en SHIPPED.');
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
      },
    });
  }

  async refundOrder(id: string, dto: RefundOrderDto) {
    const order = await this.getOrder(id);
    const payment = order.payments.find((p) => p.status === 'SUCCEEDED');
    if (!payment?.stripePaymentIntentId) {
      throw new BadRequestException('Aucun paiement éligible au remboursement.');
    }

    const refund = await this.stripeService.client.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      ...(dto.amountCents && { amount: dto.amountCents }),
      reason: 'requested_by_customer',
    });

    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.REFUNDED },
    });

    return { refundId: refund.id, amountCents: refund.amount, status: refund.status };
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  async listUsers(query: { q?: string; role?: string; page?: number }) {
    const page = query.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const where = {
      ...(query.q && {
        OR: [
          { email: { contains: query.q, mode: 'insensitive' as const } },
          { firstName: { contains: query.q, mode: 'insensitive' as const } },
          { lastName: { contains: query.q, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.role && { role: query.role as 'ADMIN' | 'CUSTOMER' }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          blocked: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        blocked: true,
        emailVerified: true,
        phone: true,
        createdAt: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, totalCents: true, currency: true, createdAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const ltv = await this.prisma.order.aggregate({
      where: { userId: id, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { totalCents: true },
    });

    return { ...user, ltvCents: ltv._sum.totalCents ?? 0 };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, role: true, blocked: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------

  async listAuditLogs(query: {
    userId?: string;
    resource?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
  }) {
    const page = query.page ?? 1;
    const take = 50;
    const skip = (page - 1) * take;

    const where = {
      ...(query.userId && { userId: query.userId }),
      ...(query.resource && { resource: query.resource }),
      ...(query.action && { action: { contains: query.action } }),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && { gte: new Date(query.from) }),
              ...(query.to && { lte: new Date(query.to) }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findProductOrThrow(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Produit introuvable.');
    return p;
  }

  private async updateStockStatus(productId: string, stock: number, lowStockThreshold: number) {
    const stockStatus =
      stock <= 0 ? 'OUT_OF_STOCK' : stock <= lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK';
    await this.prisma.product.update({ where: { id: productId }, data: { stockStatus } });
  }
}
