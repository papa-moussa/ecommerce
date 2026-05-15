import { OlfactoryFamily, Occasion, Concentration } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

// HIGH-05 (Audit-2): Typed DTO to prevent Algolia filter injection
// Replaces the previous `answers: any` in QuizController
export class SubmitQuizDto {
  @IsOptional()
  @IsEnum(OlfactoryFamily)
  family?: OlfactoryFamily;

  @IsOptional()
  @IsEnum(Occasion)
  occasion?: Occasion;

  @IsOptional()
  @IsEnum(Occasion)
  occasions?: Occasion;

  @IsOptional()
  @IsEnum(Concentration)
  intensity?: Concentration;

  @IsOptional()
  @IsEnum(Concentration)
  concentration?: Concentration;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}
