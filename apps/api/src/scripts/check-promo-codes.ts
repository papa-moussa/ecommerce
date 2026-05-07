import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const codes = await prisma.promoCode.findMany();
  console.table(codes);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
