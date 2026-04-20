import { StockReason } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class StockAdjustmentDto {
  @IsInt()
  delta!: number;

  @IsEnum(StockReason)
  reason!: StockReason;

  @IsString()
  @IsOptional()
  note?: string;
}
