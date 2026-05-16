import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// MED-03 (Audit-2): MaxLength prevents unbounded DB writes
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @IsString()
  @MaxLength(2000)
  comment!: string;
}
