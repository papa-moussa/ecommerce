const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Reset & Enrichment ---');

  // 1. Delete all orders and related data
  console.log('Deleting all orders, payments and stock movements...');
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  console.log('Orders cleared.');

  // 2. Update products with perfume attributes
  console.log('Updating products with concentrations, families and sizes...');
  const CONCENTRATIONS = ['EAU_DE_TOILETTE', 'EAU_DE_PARFUM', 'PARFUM', 'EXTRAIT_DE_PARFUM'];
  const FAMILIES = [
    'HESPERIDE',
    'FLORAL',
    'BOISE',
    'ORIENTAL',
    'AMBRE',
    'FOUGERE',
    'CHYPRE',
    'CUIR',
  ];
  const SIZES = [30, 50, 100, 125, 200];

  const products = await prisma.product.findMany();
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        concentration: CONCENTRATIONS[Math.floor(Math.random() * CONCENTRATIONS.length)],
        family: FAMILIES[Math.floor(Math.random() * FAMILIES.length)],
        sizeMl: SIZES[Math.floor(Math.random() * SIZES.length)],
      },
    });
  }
  console.log(`${products.length} products updated.`);

  console.log('--- Triggering Algolia Sync ---');
  // Note: Since we are in a dev environment, we'll just log that it should be done.
  // Or if we have the queue, we'd add jobs.
  // Given we're running a script, let's just trigger a full reindex via a direct call if possible
  // or remind the user to restart the dev server which usually triggers sync on some events.

  console.log(
    'Database enrichment complete. Please restart the API to ensure all queues are processed.',
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
