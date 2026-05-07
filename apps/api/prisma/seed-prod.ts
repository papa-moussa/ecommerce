import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  const email = 'pamodiallo@gmail.com';
  const password = 'passer123';

  console.log('👤 Creating production admin user...');

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      firstName: 'Papa',
      lastName: 'Diallo',
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
