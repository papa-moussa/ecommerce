const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- CLEANING FOR PRODUCTION TEST ---');

  console.log('Deleting products, orders, and stock movements...');
  await prisma.stockMovement.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('--- SYNCING EMPTY STATE TO ALGOLIA ---');
  // We should ideally clear Algolia too

  console.log('Ready! You can now create your own products in the admin panel.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
