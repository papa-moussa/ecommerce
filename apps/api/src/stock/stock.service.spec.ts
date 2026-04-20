import { Test } from '@nestjs/testing';
import { StockReason, type StockStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { OutOfStockException } from './exceptions/out-of-stock.exception';
import { StockService } from './stock.service';

const PRODUCT_ID = 'prod_1';

function makePrismaMock(initialStock: number) {
  let stock = initialStock;

  return {
    product: {
      updateMany: jest.fn(async ({ where }: { where: { stock: { gte: number } } }) => {
        if (stock >= where.stock.gte) {
          stock -= where.stock.gte;
          return { count: 1 };
        }
        return { count: 0 };
      }),
      findUnique: jest.fn(async () => ({ stock, lowStockThreshold: 5 })),
      update: jest.fn(
        async ({
          data,
        }: {
          data: { stockStatus?: StockStatus; stock?: { increment: number } };
        }) => {
          if (data.stock?.increment) stock += data.stock.increment;
          return { stock, lowStockThreshold: 5 };
        },
      ),
    },
    stockMovement: {
      create: jest.fn().mockResolvedValue({}),
    },
    getStock: () => stock,
  };
}

describe('StockService', () => {
  let service: StockService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  async function buildModule(initialStock: number) {
    prismaMock = makePrismaMock(initialStock);
    const module = await Test.createTestingModule({
      providers: [StockService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(StockService);
  }

  describe('reserveStock', () => {
    it('decrements stock and logs movement when sufficient', async () => {
      await buildModule(10);
      await service.reserveStock(PRODUCT_ID, 3);
      expect(prismaMock.getStock()).toBe(7);
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ delta: -3, reason: StockReason.RESERVATION }),
        }),
      );
    });

    it('throws OutOfStockException when stock is insufficient', async () => {
      await buildModule(2);
      await expect(service.reserveStock(PRODUCT_ID, 5)).rejects.toThrow(OutOfStockException);
      expect(prismaMock.stockMovement.create).not.toHaveBeenCalled();
    });

    it('throws when stock is exactly 0', async () => {
      await buildModule(0);
      await expect(service.reserveStock(PRODUCT_ID, 1)).rejects.toThrow(OutOfStockException);
    });
  });

  describe('releaseStock', () => {
    it('increments stock and logs RELEASE movement', async () => {
      await buildModule(5);
      await service.releaseStock(PRODUCT_ID, 3, 'order_1');
      expect(prismaMock.getStock()).toBe(8);
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delta: 3,
            reason: StockReason.RELEASE,
            orderId: 'order_1',
          }),
        }),
      );
    });
  });

  describe('decrementStock', () => {
    it('decrements stock and logs DECREMENT movement with orderId', async () => {
      await buildModule(10);
      await service.decrementStock(PRODUCT_ID, 4, 'order_1');
      expect(prismaMock.getStock()).toBe(6);
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delta: -4,
            reason: StockReason.DECREMENT,
            orderId: 'order_1',
          }),
        }),
      );
    });

    it('throws OutOfStockException when decrement > stock, leaves DB unchanged', async () => {
      await buildModule(3);
      await expect(service.decrementStock(PRODUCT_ID, 5, 'order_1')).rejects.toThrow(
        OutOfStockException,
      );
      expect(prismaMock.getStock()).toBe(3);
      expect(prismaMock.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('concurrent reserveStock', () => {
    it('allows exactly N reservations on stock=N (simulated sequential)', async () => {
      // Each mock call is atomic — simulate 10 concurrent calls on stock=10
      await buildModule(10);
      const results = await Promise.allSettled(
        Array.from({ length: 15 }, () => service.reserveStock(PRODUCT_ID, 1)),
      );
      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.filter((r) => r.status === 'rejected').length;
      expect(fulfilled).toBe(10);
      expect(rejected).toBe(5);
      expect(prismaMock.getStock()).toBe(0);
    });
  });
});
