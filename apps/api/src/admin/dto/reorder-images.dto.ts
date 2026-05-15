import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

// HIGH-06 (Audit-2): prevents DoS via unbounded array — capped at 100 image IDs
export class ReorderImagesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  ids: string[];
}
