import { Gender } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';


export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'featured';

export class ListProductsDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @Max(50)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @IsEnum(['price_asc', 'price_desc', 'newest', 'featured'])
  @IsOptional()
  sort?: ProductSort;
}
