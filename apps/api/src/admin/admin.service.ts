import { createHash } from 'crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { Queue } from 'bullmq';

import { type AppConfig } from '../config/configuration';
import { NotificationsService } from '../notifications/notifications.service';
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
  PENDING_CONFIRMATION: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
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
    private readonly notifications: NotificationsService,
    @InjectQueue('products') private readonly productsQueue: Queue,
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

  // SEC-016: restrict metric to a known-good allowlist — prevents log injection
  // and unexpected query behaviour from arbitrary string values.
  private static readonly VALID_METRICS: readonly string[] = ['revenue', 'orders'];

  async getMetricsTimeseries(metric: 'revenue' | 'orders', period: '7d' | '30d' | '90d') {
    if (!AdminService.VALID_METRICS.includes(metric)) {
      throw new BadRequestException(
        `Métrique invalide. Valeurs autorisées : ${AdminService.VALID_METRICS.join(', ')}`,
      );
    }

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

    // MED-05 (Audit-2): restrict allowed formats and file size server-side via signed params
    const allowedFormats = 'jpg,png,webp,gif';
    const maxFileSize = 5_242_880; // 5 MB
    const toSign = `allowed_formats=${allowedFormats}&folder=${folder}&max_file_size=${maxFileSize}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(toSign).digest('hex');

    return { signature, timestamp, apiKey, cloudName, folder, allowedFormats, maxFileSize };
  }

  // ---------------------------------------------------------------------------
  // Products CRUD
  // ---------------------------------------------------------------------------

  async listProducts(query: { q?: string; category?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const take = Number(query.limit) || 20;
    const skip = (page - 1) * take;

    const where = {
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' as const } },
          { brand: { contains: query.q, mode: 'insensitive' as const } },
          { sku: { contains: query.q, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.category && { categoryId: query.category }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { variants: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit: take,
      pages: Math.ceil(total / take),
    };
  }

  async createProduct(dto: CreateProductDto, adminId: string) {
    const { variants, ...productData } = dto;

    const product = (await this.prisma.product.create({
      data: {
        ...productData,
        variants: variants
          ? {
              create: variants.map((v) => ({
                sizeMl: v.sizeMl,
                priceCents: v.priceCents ?? null,
                stock: v.stock,
                sku: v.sku ?? null,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: { where: { isMain: true }, take: 1 },
        variants: true,
      },
    })) as any;

    if (dto.stock > 0 && (!variants || variants.length === 0)) {
      await this.prisma.stockMovement.create({
        data: { productId: product.id, delta: dto.stock, reason: 'INITIAL', createdBy: adminId },
      });
    }

    // If variants were created, we should also log their initial stock
    if (variants && variants.length > 0) {
      await Promise.all(
        product.variants.map((v: any) =>
          this.prisma.stockMovement.create({
            data: {
              productId: product.id,
              variantId: v.id,
              delta: v.stock,
              reason: 'INITIAL',
              createdBy: adminId,
            },
          }),
        ),
      );
    }

    // Sync to Algolia (Async)
    await this.productsQueue.add('sync-product', { productId: product.id });

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.findProductOrThrow(id);
    const { variants, ...updateData } = dto;
    const product = await this.prisma.product.update({
      where: { id },
      data: updateData as any,
      include: { category: true, images: { where: { isMain: true }, take: 1 } },
    });

    // Sync to Algolia (Async)
    await this.productsQueue.add('sync-product', { productId: product.id });

    return product;
  }

  async deleteProduct(id: string) {
    await this.findProductOrThrow(id);

    // Hard delete product (variants and images will be deleted by cascade if configured,
    // but let's be explicit if needed or let Prisma handle it)
    const product = await this.prisma.product.delete({
      where: { id },
    });

    // Remove from Algolia (Async)
    await this.productsQueue.add('delete-product', { productId: id });

    return product;
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
    const product = await this.findProductOrThrow(productId);

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId, productId },
      });
      if (!variant) throw new NotFoundException('Variante introuvable.');

      const [movement, _updatedVariant] = await this.prisma.$transaction([
        this.prisma.stockMovement.create({
          data: {
            productId,
            variantId: dto.variantId,
            delta: dto.delta,
            reason: dto.reason,
            note: dto.note,
            createdBy: adminId,
          },
        }),
        this.prisma.productVariant.update({
          where: { id: dto.variantId },
          data: { stock: { increment: dto.delta } },
        }),
      ]);

      // If this is the "main" variant (e.g., first one), we might want to sync with product stock
      // For now, we update the product's overall stock status based on the total stock or this specific movement
      const allVariants = await this.prisma.productVariant.findMany({ where: { productId } });
      const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);

      await this.prisma.product.update({
        where: { id: productId },
        data: { stock: totalStock },
      });
      await this.updateStockStatus(productId, totalStock, product.lowStockThreshold);

      return movement;
    }

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

    await this.updateStockStatus(productId, updated.stock, updated.lowStockThreshold);
    return movement;
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  async listOrders(query: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const take = Number(query.limit) || 20;
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

    return {
      items,
      total,
      page,
      limit: take,
      pages: Math.ceil(total / take),
    };
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
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
      },
    });

    // Fire-and-forget email notification to the customer
    const email = order.user?.email || order.customerEmail;
    const name = order.user?.firstName || 'Client';

    if (email) {
      void this.notifications.sendOrderStatusEmail(
        email,
        name,
        id,
        dto.status,
        dto.trackingNumber ?? order.trackingNumber,
        order.user?.id,
      );
    }

    return updated;
  }

  async refundOrder(id: string, dto: RefundOrderDto) {
    const order = await this.getOrder(id);
    const payment = order.payments.find((p) => p.status === 'SUCCEEDED');
    if (!payment?.stripePaymentIntentId) {
      throw new BadRequestException('Aucun paiement éligible au remboursement.');
    }

    // LOW-04 (Audit-2): cap refund amount to avoid exceeding original payment
    if (dto.amountCents && dto.amountCents > payment.amountCents) {
      throw new BadRequestException(
        `Remboursement (${dto.amountCents}¢) supérieur au paiement original (${payment.amountCents}¢)`,
      );
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

  async listUsers(query: { q?: string; role?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const take = Number(query.limit) || 20;
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

    return {
      items,
      total,
      page,
      limit: take,
      pages: Math.ceil(total / take),
    };
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

  async listEmailLogs(query: { page?: number; to?: string }) {
    const page = query.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const where = {
      ...(query.to && { to: { contains: query.to, mode: 'insensitive' as const } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / take) };
  }

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
