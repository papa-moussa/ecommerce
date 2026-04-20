import { Gender } from '@prisma/client';
import { IsArray, IsBoolean, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString() slug!: string;
  @IsString() sku!: string;
  @IsString() brand!: string;
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() @IsOptional() storyTelling?: string;
  @IsArray() @IsString({ each: true }) topNotes!: string[];
  @IsArray() @IsString({ each: true }) heartNotes!: string[];
  @IsArray() @IsString({ each: true }) baseNotes!: string[];
  @IsString() gender!: Gender;
  @IsString() categoryId!: string;
  @IsInt() @IsPositive() priceCents!: number;
  @IsInt() @Min(0) stock!: number;
  @IsInt() @Min(0) @IsOptional() lowStockThreshold?: number;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
