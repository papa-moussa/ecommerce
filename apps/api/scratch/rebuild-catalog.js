const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- REBUILDING CATALOG ---');

  // 1. Clear everything
  console.log('Clearing old data...');
  try {
    await prisma.stockMovement.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
  } catch (e) {}

  // 2. Create Categories
  console.log('Creating categories...');
  const catNames = [
    'Parfum de Niche',
    'Parfum Designer',
    'Parfum Mass Market',
    'Best Seller',
    'Nouveautés',
  ];
  const categories = {};
  for (const name of catNames) {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/é/g, 'e');
    categories[slug] = await prisma.category.create({ data: { name, slug } });
  }

  // 3. Create Products (Sample list)
  const sampleProducts = [
    {
      name: 'Aventus',
      brand: 'Creed',
      cat: 'parfum-de-niche',
      gender: 'HOMME',
      family: 'BOISE',
      concentration: 'PARFUM',
    },
    {
      name: 'N°5',
      brand: 'Chanel',
      cat: 'best-seller',
      gender: 'FEMME',
      family: 'FLORAL',
      concentration: 'EAU_DE_PARFUM',
    },
    {
      name: 'Sauvage',
      brand: 'Dior',
      cat: 'best-seller',
      gender: 'HOMME',
      family: 'FOUGERE',
      concentration: 'EAU_DE_TOILETTE',
    },
    {
      name: 'Black Opium',
      brand: 'YSL',
      cat: 'parfum-designer',
      gender: 'FEMME',
      family: 'ORIENTAL',
      concentration: 'EAU_DE_PARFUM',
    },
    {
      name: 'Oud Wood',
      brand: 'Tom Ford',
      cat: 'parfum-de-niche',
      gender: 'UNISEXE',
      family: 'BOISE',
      concentration: 'PARFUM',
    },
  ];

  for (const p of sampleProducts) {
    const slug = `${p.brand.toLowerCase()}-${p.name.toLowerCase()}`.replace(/ /g, '-');
    await prisma.product.create({
      data: {
        name: p.name,
        brand: p.brand,
        slug,
        sku: `${p.brand.substring(0, 2)}-${p.name.substring(0, 2)}-01`.toUpperCase(),
        description: `Un magnifique ${p.name} par ${p.brand}.`,
        priceCents: 12000,
        stock: 50,
        gender: p.gender,
        categoryId: categories[p.cat].id,
        family: p.family,
        concentration: p.concentration,
        sizeMl: 100,
        isActive: true,
        images: {
          create: { url: `https://picsum.photos/seed/${slug}/800/600`, alt: p.name, isMain: true },
        },
      },
    });
    console.log(`+ ${p.brand} ${p.name}`);
  }

  console.log('Rebuild complete. Run reindex-algolia to finish.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
