import { Injectable } from '@nestjs/common';
import { type Prisma, StockReason, StockStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { OutOfStockException } from './exceptions/out-of-stock.exception';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async reserveStock(
    productId: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await this.atomicDecrement(client, productId, quantity, StockReason.RESERVATION);
  }

  async releaseStock(
    productId: string,
    quantity: number,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await this.atomicIncrement(client, productId, quantity, StockReason.RELEASE, orderId);
  }

  async decrementStock(
    productId: string,
    quantity: number,
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await this.atomicDecrement(client, productId, quantity, StockReason.DECREMENT, orderId);
  }

  private async atomicDecrement(
    client: Prisma.TransactionClient | PrismaService,
    productId: string,
    quantity: number,
    reason: StockReason,
    orderId?: string,
  ): Promise<void> {
    const updated = await (client as PrismaService).product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });

    if (updated.count === 0) throw new OutOfStockException(productId);

    const product = await (client as PrismaService).product.findUnique({
      where: { id: productId },
      select: { stock: true, lowStockThreshold: true },
    });

    if (product) {
      const newStatus = resolveStockStatus(product.stock, product.lowStockThreshold);
      await (client as PrismaService).product.update({
        where: { id: productId },
        data: { stockStatus: newStatus },
      });
    }

    await (client as PrismaService).stockMovement.create({
      data: { productId, delta: -quantity, reason, orderId },
    });
  }

  private async atomicIncrement(
    client: Prisma.TransactionClient | PrismaService,
    productId: string,
    quantity: number,
    reason: StockReason,
    orderId?: string,
  ): Promise<void> {
    const product = await (client as PrismaService).product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
      select: { stock: true, lowStockThreshold: true },
    });

    const newStatus = resolveStockStatus(product.stock, product.lowStockThreshold);
    await (client as PrismaService).product.update({
      where: { id: productId },
      data: { stockStatus: newStatus },
    });

    await (client as PrismaService).stockMovement.create({
      data: { productId, delta: quantity, reason, orderId },
    });
  }
}

function resolveStockStatus(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return StockStatus.OUT_OF_STOCK;
  if (stock <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}
