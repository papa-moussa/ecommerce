import { IsString, Length } from 'class-validator';

export class TotpVerifyDto {
  @IsString()
  @Length(6, 8)
  code!: string;
}
