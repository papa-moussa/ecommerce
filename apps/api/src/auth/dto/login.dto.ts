import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  // MED-04 (Audit-2): bcrypt truncates at 72 bytes
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
