import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  // LOW-03 (Audit-2): reject malformed tokens before hitting the DB
  @IsString()
  @Matches(/^[0-9a-f]{64}$/, { message: 'Token invalide' })
  token!: string;

  // MED-04 (Audit-2): bcrypt truncates at 72 bytes
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
