import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { UsersService } from './users.service';

const mockUser: User = {
  id: 'cuid_1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  firstName: 'Alice',
  lastName: 'Dupont',
  phone: null,
  role: 'CUSTOMER',
  emailVerified: false,
  blocked: false,
  marketingOptIn: true,
  totpSecret: null,
  totpEnabled: false,
  backupCodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('stores bcrypt hash (not plain text) and calls prisma.create', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const { passwordHash: _ph, ...publicUser } = mockUser;
      prismaMock.user.create.mockResolvedValue(publicUser);

      await service.create({
        email: 'test@example.com',
        password: 'Secret1234!',
        firstName: 'Alice',
        lastName: 'Dupont',
      });

      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      const callArg = prismaMock.user.create.mock.calls[0][0] as { data: { passwordHash: string } };
      const { passwordHash } = callArg.data;
      expect(passwordHash).not.toBe('Secret1234!');
      expect(passwordHash).toMatch(/^\$2[ab]\$/);
      const valid = await bcrypt.compare('Secret1234!', passwordHash);
      expect(valid).toBe(true);
    });

    it('throws ConflictException when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'test@example.com',
          password: 'Secret1234!',
          firstName: 'Alice',
          lastName: 'Dupont',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('updates allowed fields only', async () => {
      const updated = { ...mockUser, firstName: 'Bob' };
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.updateMe('cuid_1', { firstName: 'Bob' });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'cuid_1' }, data: { firstName: 'Bob' } }),
      );
      expect(result).toEqual(updated);
    });
  });
});
