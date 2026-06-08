import {
  PrismaClient,
  type Occasion,
  type Concentration,
  type OlfactoryFamily,
} from '@prisma/client';

const prisma = new PrismaClient();

const CONCENTRATIONS: Concentration[] = [
  'EAU_FRAICHE',
  'EAU_DE_COLOGNE',
  'EAU_DE_TOILETTE',
  'EAU_DE_PARFUM',
  'PARFUM',
  'EXTRAIT_DE_PARFUM',
];
const FAMILIES: OlfactoryFamily[] = [
  'HESPERIDE',
  'FLORAL',
  'BOISE',
  'ORIENTAL',
  'AMBRE',
  'FOUGERE',
  'CHYPRE',
  'CUIR',
];
const OCCASIONS: Occasion[] = ['DAILY', 'EVENING', 'SPECIAL', 'SPORT', 'OFFICE'];

async function main() {
  console.log('Seeding quiz data for products...');
  const products = await prisma.product.findMany();

  for (const product of products) {
    const concentration = CONCENTRATIONS[Math.floor(Math.random() * CONCENTRATIONS.length)];
    const family = FAMILIES[Math.floor(Math.random() * FAMILIES.length)];
    const occasions = [
      OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)],
      OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)],
    ].filter((v, i, a) => a.indexOf(v) === i);

    await prisma.product.update({
      where: { id: product.id },
      data: {
        concentration,
        family,
        occasions,
      },
    });
    console.log(
      `Updated product ${product.name} with concentration: ${concentration}, family: ${family}`,
    );
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
