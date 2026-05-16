import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// MED-01 (Audit-2): replaces @Query() query: any in listEmailLogs
export class ListEmailLogsDto {
  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
