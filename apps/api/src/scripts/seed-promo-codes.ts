import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const codes = [
    {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      isActive: true,
      maxUsesPerUser: 1,
    },
    {
      code: 'REVIENS10',
      type: 'PERCENTAGE',
      value: 10,
      isActive: true,
      minOrderCents: 5000,
    },
  ];

  for (const c of codes) {
    await prisma.promoCode.upsert({
      where: { code: c.code },
      update: {},
      create: c as any,
    });
  }

  console.log('Seed promo codes completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
