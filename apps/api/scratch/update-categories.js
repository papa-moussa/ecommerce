const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up old categories...');
  // Note: This will fail if there are products linked to these categories.
  // In a dev environment, we can either clear products or just update.
  // Let's try to delete them, if it fails, we'll just add new ones.
  try {
    await prisma.category.deleteMany({});
    console.log('Old categories removed.');
  } catch (e) {
    console.log('Could not remove some categories (probably linked to products).');
  }

  const categories = [
    { name: 'Parfum de Niche', slug: 'parfum-de-niche' },
    { name: 'Parfum Designer', slug: 'parfum-designer' },
    { name: 'Parfum Mass Market', slug: 'parfum-mass-market' },
    { name: 'Best Seller', slug: 'best-seller' },
    { name: 'Nouveautés', slug: 'nouveautes' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }

  console.log('Categories successfully updated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
