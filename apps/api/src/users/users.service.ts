import { createHmac, timingSafeEqual } from 'node:crypto';

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

import { type CreateUserDto } from './dto/create-user.dto';
import { type UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  emailVerified: true,
  blocked: true,
  marketingOptIn: true,
  totpEnabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type PublicUser = Omit<User, 'passwordHash' | 'totpSecret' | 'backupCodes'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // HIGH-04 (Audit-2): generate a stateless HMAC token for unsubscribe links
  generateUnsubscribeToken(email: string): string {
    const secret = this.config.get('UNSUBSCRIBE_SECRET', { infer: true });
    return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
  }

  private verifyUnsubscribeToken(email: string, token: string): void {
    const expected = this.generateUnsubscribeToken(email);
    let tokenBuf: Buffer;
    try {
      tokenBuf = Buffer.from(token, 'hex');
    } catch {
      throw new UnauthorizedException('Token de désabonnement invalide');
    }
    const expectedBuf = Buffer.from(expected, 'hex');
    if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
      throw new UnauthorizedException('Token de désabonnement invalide');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_PUBLIC_SELECT,
    });
  }

  // HIGH-04 (Audit-2): token required — prevents anyone from silencing any email address
  async unsubscribe(email: string, token: string): Promise<{ success: boolean }> {
    this.verifyUnsubscribeToken(email, token);
    await this.prisma.user.updateMany({
      where: { email: email.toLowerCase() },
      data: { marketingOptIn: false },
    });
    return { success: true };
  }
}
