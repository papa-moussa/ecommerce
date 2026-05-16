import { StockReason } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class StockAdjustmentDto {
  // LOW-02 (Audit-2): prevents large negative deltas creating invalid stock states
  @IsInt()
  @Min(-10000)
  @Max(10000)
  delta!: number;

  @IsEnum(StockReason)
  reason!: StockReason;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  variantId?: string;
}
