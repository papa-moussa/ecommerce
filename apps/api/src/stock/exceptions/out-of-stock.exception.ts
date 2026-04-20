import { ConflictException } from '@nestjs/common';

export class OutOfStockException extends ConflictException {
  constructor(productId: string) {
    super(`Product "${productId}" is out of stock or has insufficient quantity`);
  }
}
