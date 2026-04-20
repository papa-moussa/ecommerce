import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const BCRYPT_ROUNDS = 12;

  const [admin, customer] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@maisonparfum.fr' },
      update: {},
      create: {
        email: 'admin@maisonparfum.fr',
        passwordHash: await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS),
        firstName: 'Admin',
        lastName: 'Maison',
        role: Role.ADMIN,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'client@maisonparfum.fr' },
      update: {},
      create: {
        email: 'client@maisonparfum.fr',
        passwordHash: await bcrypt.hash('Client1234!', BCRYPT_ROUNDS),
        firstName: 'Sophie',
        lastName: 'Dupont',
        role: Role.CUSTOMER,
        emailVerified: true,
      },
    }),
  ]);

  process.stdout.write(`Seeded users: admin=${admin.email} customer=${customer.email}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
