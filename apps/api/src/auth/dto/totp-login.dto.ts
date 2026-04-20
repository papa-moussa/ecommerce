import { IsString } from 'class-validator';

export class TotpLoginDto {
  @IsString()
  tempToken!: string;

  @IsString()
  code!: string;
}
