import { Gender, Concentration, OlfactoryFamily } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class VariantDto {
  @IsInt() @IsPositive() sizeMl!: number;
  @IsInt() @IsPositive() @IsOptional() priceCents?: number;
  @IsInt() @Min(0) stock!: number;
  @IsString() @IsOptional() sku?: string;
}

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
  @IsInt() @IsPositive() @IsOptional() sizeMl?: number;
  @IsString() gender!: Gender;
  @IsString() categoryId!: string;
  @IsInt() @IsPositive() priceCents!: number;
  @IsInt() @Min(0) stock!: number;
  @IsInt() @Min(0) @IsOptional() lowStockThreshold?: number;
  @IsEnum(Concentration) @IsOptional() concentration?: Concentration;
  @IsEnum(OlfactoryFamily) @IsOptional() family?: OlfactoryFamily;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsBoolean() @IsOptional() isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];
}
