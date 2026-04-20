import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class RefundOrderDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  amountCents?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
