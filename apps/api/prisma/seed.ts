import { Gender, PrismaClient, Role, StockReason, StockStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function clearDatabaseExceptUsers() {
  process.stdout.write('🧹 Cleaning database (except users)...\n');

  // order of deletion matters for foreign keys
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.promoCodeUsage.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.quizResult.deleteMany();
  await prisma.healthCheck.deleteMany();
  await prisma.webhookEvent.deleteMany();

  process.stdout.write('✔ Cleanup complete.\n');
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

async function seedUsers() {
  const [admin, sophie, marc] = await Promise.all([
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
      where: { email: 'sophie@example.fr' },
      update: {},
      create: {
        email: 'sophie@example.fr',
        passwordHash: await bcrypt.hash('Client1234!', BCRYPT_ROUNDS),
        firstName: 'Sophie',
        lastName: 'Dupont',
        role: Role.CUSTOMER,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'marc@example.fr' },
      update: {},
      create: {
        email: 'marc@example.fr',
        passwordHash: await bcrypt.hash('Client1234!', BCRYPT_ROUNDS),
        firstName: 'Marc',
        lastName: 'Lefebvre',
        role: Role.CUSTOMER,
        emailVerified: true,
      },
    }),
  ]);

  process.stdout.write(`✔ Users: ${admin.email}, ${sophie.email}, ${marc.email}\n`);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

async function seedCategories() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'parfum-de-niche' },
      update: {},
      create: {
        slug: 'parfum-de-niche',
        name: 'Parfum de Niche',
        description: 'Des créations rares et exclusives pour les connaisseurs.',
        imageUrl: 'https://picsum.photos/seed/niche/800/600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'parfum-designer' },
      update: {},
      create: {
        slug: 'parfum-designer',
        name: 'Parfum Designer',
        description: 'Les grandes maisons de couture et de luxe.',
        imageUrl: 'https://picsum.photos/seed/designer/800/600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'parfum-mass-market' },
      update: {},
      create: {
        slug: 'parfum-mass-market',
        name: 'Parfum Mass Market',
        description: 'Des fragrances accessibles pour tous les jours.',
        imageUrl: 'https://picsum.photos/seed/mass/800/600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'best-seller' },
      update: {},
      create: {
        slug: 'best-seller',
        name: 'Best Seller',
        description: 'Nos parfums les plus plébiscités.',
        imageUrl: 'https://picsum.photos/seed/best/800/600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'nouveautes' },
      update: {},
      create: {
        slug: 'nouveautes',
        name: 'Nouveautés',
        description: 'Découvrez nos dernières pépites.',
        imageUrl: 'https://picsum.photos/seed/new/800/600',
      },
    }),
  ]);

  process.stdout.write(`✔ Categories: ${categories.map((c) => c.slug).join(', ')}\n`);
  return {
    niche: categories[0]!,
    designer: categories[1]!,
    mass: categories[2]!,
    best: categories[3]!,
    news: categories[4]!,
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface ProductSeed {
  slug: string;
  sku: string;
  brand: string;
  name: string;
  description: string;
  storyTelling?: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  gender: Gender;
  categorySlug: string;
  priceCents: number;
  stock: number;
  stockStatus: StockStatus;
  lowStockThreshold: number;
  concentration: string;
  family: string;
  sizeMl: number;
  isFeatured?: boolean;
  imageSeeds: string[];
  variants: { sizeMl: number; priceCents: number; stock: number }[];
}

const PRODUCTS: ProductSeed[] = [
  // ---- BEST SELLERS (Iconic) ------------------------------------------------
  {
    slug: 'chanel-n5',
    sku: 'CH-N5-100',
    brand: 'Chanel',
    name: 'N°5',
    description:
      'Le parfum le plus célèbre au monde. Une composition florale aldéhydée intemporelle.',
    storyTelling:
      'En 1921, Gabrielle Chanel demande au parfumeur Ernest Beaux de créer un parfum révolutionnaire. Numéro 5 devient une icône absolue.',
    topNotes: ['Aldéhydes', 'Néroli', 'Ylang-ylang'],
    heartNotes: ['Rose de mai', 'Jasmin', 'Iris'],
    baseNotes: ['Vétiver', 'Santal', 'Vanille', 'Musc blanc'],
    gender: Gender.FEMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 100,
    priceCents: 95000,
    stock: 42,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['chanel-n5-1', 'chanel-n5-2'],
    variants: [
      { sizeMl: 30, priceCents: 65000, stock: 15 },
      { sizeMl: 50, priceCents: 95000, stock: 18 },
      { sizeMl: 100, priceCents: 145000, stock: 9 },
    ],
  },
  {
    slug: 'dior-sauvage',
    sku: 'DI-SA-100',
    brand: 'Dior',
    name: 'Sauvage',
    description: 'Un parfum masculin intense et sauvage, inspiré des grands espaces.',
    storyTelling:
      'Sauvage est un cri vers le ciel. Un parfum radical et noble, inspiré des grands espaces désertiques.',
    topNotes: ['Bergamote de Calabre', 'Poivre'],
    heartNotes: ['Lavande', 'Poivre de Sichuan', 'Géranium', 'Vétiver'],
    baseNotes: ['Ambre', 'Cèdre', 'Labnum'],
    gender: Gender.HOMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_TOILETTE',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 75000,
    stock: 50,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['dior-sauvage-1', 'dior-sauvage-2'],
    variants: [
      { sizeMl: 60, priceCents: 55000, stock: 20 },
      { sizeMl: 100, priceCents: 75000, stock: 20 },
    ],
  },
  {
    slug: 'ysl-libre',
    sku: 'YS-LI-100',
    brand: 'Yves Saint Laurent',
    name: 'Libre',
    description:
      "Le parfum d'une femme libre et audacieuse. Une lavande florale, sensuelle et solaire.",
    topNotes: ['Mandarine', 'Lavande', 'Cassis'],
    heartNotes: ['Jasmin', 'Lavande', "Fleur d'oranger"],
    baseNotes: ['Vanille de Madagascar', 'Cèdre', 'Ambre gris'],
    gender: Gender.FEMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 90,
    priceCents: 85000,
    stock: 30,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['ysl-libre-1'],
    variants: [
      { sizeMl: 30, priceCents: 45000, stock: 10 },
      { sizeMl: 50, priceCents: 65000, stock: 12 },
      { sizeMl: 90, priceCents: 85000, stock: 8 },
    ],
  },
  {
    slug: 'creed-aventus',
    sku: 'CR-AV-100',
    brand: 'Creed',
    name: 'Aventus',
    description: 'Le parfum de référence pour hommes ambitieux — fruité, boisé et fumé.',
    topNotes: ['Ananas', 'Bergamote', 'Pomme'],
    heartNotes: ['Bouleau', 'Patchouli', 'Jasmin'],
    baseNotes: ['Musc', 'Mousse de chêne', 'Ambre gris'],
    gender: Gender.HOMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_PARFUM',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 250000,
    stock: 15,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: true,
    imageSeeds: ['creed-aventus-1'],
    variants: [
      { sizeMl: 50, priceCents: 155000, stock: 6 },
      { sizeMl: 100, priceCents: 250000, stock: 9 },
    ],
  },
  {
    slug: 'lancome-la-vie-est-belle',
    sku: 'LA-VB-100',
    brand: 'Lancôme',
    name: 'La Vie Est Belle',
    description:
      "Une déclaration universelle à la beauté de la vie. L'iris gourmand par excellence.",
    topNotes: ['Cassis', 'Poire'],
    heartNotes: ['Iris', 'Jasmin', "Fleur d'oranger"],
    baseNotes: ['Patchouli', 'Fève tonka', 'Vanille', 'Praliné'],
    gender: Gender.FEMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 100,
    priceCents: 82000,
    stock: 45,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['lancome-lavie-1'],
    variants: [
      { sizeMl: 30, priceCents: 45000, stock: 15 },
      { sizeMl: 50, priceCents: 62000, stock: 20 },
      { sizeMl: 100, priceCents: 82000, stock: 10 },
    ],
  },
  {
    slug: 'armani-acqua-di-gio',
    sku: 'AR-AG-100',
    brand: 'Giorgio Armani',
    name: 'Acqua di Giò',
    description: 'Un hymne à la mer Méditerranée. Frais, aquatique et intemporel.',
    topNotes: ['Lime', 'Citron', 'Bergamote'],
    heartNotes: ['Notes marines', 'Jasmin', 'Calone'],
    baseNotes: ['Cèdre', 'Patchouli', 'Musc blanc'],
    gender: Gender.HOMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_TOILETTE',
    family: 'HESPERIDE',
    sizeMl: 100,
    priceCents: 62000,
    stock: 60,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['armani-acqua-1'],
    variants: [
      { sizeMl: 50, priceCents: 45000, stock: 25 },
      { sizeMl: 100, priceCents: 62000, stock: 25 },
      { sizeMl: 200, priceCents: 95000, stock: 10 },
    ],
  },
  {
    slug: 'hermes-terre-dhermes',
    sku: 'HE-TH-100',
    brand: 'Hermès',
    name: "Terre d'Hermès",
    description: 'Un voyage olfactif entre ciel et terre. Minéral et boisé.',
    topNotes: ['Orange', 'Pamplemousse'],
    heartNotes: ['Poivre', 'Géranium', 'Silex'],
    baseNotes: ['Vétiver', 'Patchouli', 'Cèdre'],
    gender: Gender.HOMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_TOILETTE',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 75000,
    stock: 35,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['hermes-terre-1'],
    variants: [
      { sizeMl: 50, priceCents: 55000, stock: 15 },
      { sizeMl: 100, priceCents: 75000, stock: 15 },
      { sizeMl: 200, priceCents: 110000, stock: 5 },
    ],
  },
  {
    slug: 'paco-rabanne-1-million',
    sku: 'PR-1M-100',
    brand: 'Paco Rabanne',
    name: '1 Million',
    description: "Le parfum de l'insolence. Un lingot d'or aux accords de cuir et d'épices.",
    topNotes: ['Mandarine', 'Menthe'],
    heartNotes: ['Rose', 'Cannelle'],
    baseNotes: ['Cuir', 'Ambre', 'Patchouli'],
    gender: Gender.HOMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_TOILETTE',
    family: 'ORIENTAL',
    sizeMl: 100,
    priceCents: 59000,
    stock: 55,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['paco-1m-1'],
    variants: [
      { sizeMl: 50, priceCents: 42000, stock: 20 },
      { sizeMl: 100, priceCents: 59000, stock: 25 },
      { sizeMl: 200, priceCents: 85000, stock: 10 },
    ],
  },
  {
    slug: 'mugler-angel',
    sku: 'MU-AN-100',
    brand: 'Mugler',
    name: 'Angel',
    description:
      'Le premier parfum gourmand. Une étoile céleste aux notes de patchouli et de praline.',
    topNotes: ['Bergamote', 'Cassis'],
    heartNotes: ['Fruits rouges', 'Miel'],
    baseNotes: ['Patchouli', 'Vanille', 'Caramel'],
    gender: Gender.FEMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_PARFUM',
    family: 'ORIENTAL',
    sizeMl: 50,
    priceCents: 72000,
    stock: 25,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['mugler-angel-1'],
    variants: [
      { sizeMl: 25, priceCents: 49000, stock: 10 },
      { sizeMl: 50, priceCents: 72000, stock: 10 },
      { sizeMl: 100, priceCents: 105000, stock: 5 },
    ],
  },
  {
    slug: 'guerlain-shalimar',
    sku: 'GU-SH-100',
    brand: 'Guerlain',
    name: 'Shalimar',
    description: "L'icône orientale. Une ode à l'amour éternel entre un empereur et une princesse.",
    topNotes: ['Citron', 'Bergamote'],
    heartNotes: ['Jasmin', 'Rose'],
    baseNotes: ['Vanille', 'Iris', 'Encens', 'Fève tonka'],
    gender: Gender.FEMME,
    categorySlug: 'best',
    concentration: 'EAU_DE_PARFUM',
    family: 'ORIENTAL',
    sizeMl: 50,
    priceCents: 78000,
    stock: 20,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['guerlain-shalimar-1'],
    variants: [
      { sizeMl: 30, priceCents: 55000, stock: 8 },
      { sizeMl: 50, priceCents: 78000, stock: 8 },
      { sizeMl: 90, priceCents: 115000, stock: 4 },
    ],
  },

  // ---- NICHE (Luxury & Exclusive) -------------------------------------------
  {
    slug: 'mfk-baccarat-rouge-540',
    sku: 'MF-BR-540',
    brand: 'Maison Francis Kurkdjian',
    name: 'Baccarat Rouge 540',
    description: 'Une signature olfactrice graphique et condensée. Lumineuse et racée.',
    topNotes: ['Jasmin', 'Safran'],
    heartNotes: ['Ambre gris'],
    baseNotes: ['Cèdre', 'Résine de sapin'],
    gender: Gender.UNISEXE,
    categorySlug: 'niche',
    concentration: 'EXTRAIT_DE_PARFUM',
    family: 'AMBRE',
    sizeMl: 70,
    priceCents: 225000,
    stock: 12,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 2,
    isFeatured: true,
    imageSeeds: ['mfk-baccarat-1'],
    variants: [
      { sizeMl: 35, priceCents: 125000, stock: 5 },
      { sizeMl: 70, priceCents: 225000, stock: 5 },
      { sizeMl: 200, priceCents: 425000, stock: 2 },
    ],
  },
  {
    slug: 'byredo-gypsy-water',
    sku: 'BY-GW-100',
    brand: 'Byredo',
    name: 'Gypsy Water',
    description: 'Une ode à la culture romani. Terreuse, boisée et libre.',
    topNotes: ['Bergamote', 'Citron', 'Poivre'],
    heartNotes: ['Encens', 'Aiguilles de pin', 'Iris'],
    baseNotes: ['Ambre', 'Vanille', 'Santal'],
    gender: Gender.UNISEXE,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 145000,
    stock: 18,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: false,
    imageSeeds: ['byredo-gypsy-1'],
    variants: [
      { sizeMl: 50, priceCents: 95000, stock: 10 },
      { sizeMl: 100, priceCents: 145000, stock: 8 },
    ],
  },
  {
    slug: 'le-labo-santal-33',
    sku: 'LL-S3-100',
    brand: 'Le Labo',
    name: 'Santal 33',
    description: "L'esprit du Grand Ouest américain. Un parfum culte boisé et poudré.",
    topNotes: ['Violette', 'Iris'],
    heartNotes: ['Cardamome', 'Papyrus'],
    baseNotes: ['Santal', 'Cèdre', 'Cuir'],
    gender: Gender.UNISEXE,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 185000,
    stock: 15,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: true,
    imageSeeds: ['lelabo-santal-1'],
    variants: [
      { sizeMl: 50, priceCents: 125000, stock: 8 },
      { sizeMl: 100, priceCents: 185000, stock: 7 },
    ],
  },
  {
    slug: 'diptyque-philosykos',
    sku: 'DI-PH-100',
    brand: 'Diptyque',
    name: 'Philosykos',
    description: 'Le figuier dans toute sa splendeur. Feuilles, bois et fruit.',
    topNotes: ['Feuille de figuier', 'Figue'],
    heartNotes: ['Noix de coco', 'Notes vertes'],
    baseNotes: ['Cèdre', 'Bois de figuier'],
    gender: Gender.UNISEXE,
    categorySlug: 'niche',
    concentration: 'EAU_DE_TOILETTE',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 98000,
    stock: 22,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['diptyque-phil-1'],
    variants: [
      { sizeMl: 50, priceCents: 72000, stock: 12 },
      { sizeMl: 100, priceCents: 98000, stock: 10 },
    ],
  },
  {
    slug: 'tom-ford-tobacco-vanille',
    sku: 'TF-TV-100',
    brand: 'Tom Ford',
    name: 'Tobacco Vanille',
    description: "Une réinterprétation moderne d'un club de gentlemen anglais.",
    topNotes: ['Feuilles de tabac', 'Épices'],
    heartNotes: ['Fève tonka', 'Fleur de tabac', 'Vanille'],
    baseNotes: ['Fruits secs', 'Notes boisées'],
    gender: Gender.UNISEXE,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'ORIENTAL',
    sizeMl: 50,
    priceCents: 165000,
    stock: 14,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 2,
    isFeatured: true,
    imageSeeds: ['tomford-tobacco-1'],
    variants: [
      { sizeMl: 30, priceCents: 105000, stock: 6 },
      { sizeMl: 50, priceCents: 165000, stock: 8 },
    ],
  },
  {
    slug: 'frederic-malle-portrait-of-a-lady',
    sku: 'FM-PL-100',
    brand: 'Frederic Malle',
    name: 'Portrait of a Lady',
    description: 'Une dose extravagante de rose turque sur un lit de patchouli.',
    topNotes: ['Rose', 'Girofle', 'Framboise'],
    heartNotes: ['Patchouli', 'Santal', 'Encens'],
    baseNotes: ['Musc', 'Ambre', 'Benjoin'],
    gender: Gender.FEMME,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 100,
    priceCents: 210000,
    stock: 10,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 2,
    isFeatured: false,
    imageSeeds: ['fredericmalle-portrait-1'],
    variants: [
      { sizeMl: 50, priceCents: 135000, stock: 5 },
      { sizeMl: 100, priceCents: 210000, stock: 5 },
    ],
  },
  {
    slug: 'parfums-de-marly-layton',
    sku: 'PM-LA-100',
    brand: 'Parfums de Marly',
    name: 'Layton',
    description: 'Une fragrance addictive et élégante qui incarne la noblesse française.',
    topNotes: ['Pomme', 'Lavande', 'Bergamote'],
    heartNotes: ['Jasmin', 'Violette', 'Géranium'],
    baseNotes: ['Vanille', 'Poivre', 'Santal', 'Gaïac'],
    gender: Gender.HOMME,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'ORIENTAL',
    sizeMl: 125,
    priceCents: 155000,
    stock: 20,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: true,
    imageSeeds: ['marly-layton-1'],
    variants: [
      { sizeMl: 75, priceCents: 115000, stock: 10 },
      { sizeMl: 125, priceCents: 155000, stock: 10 },
    ],
  },
  {
    slug: 'xerjoff-naxos',
    sku: 'XE-NA-100',
    brand: 'Xerjoff',
    name: 'Naxos',
    description: 'Un hommage à la Sicile. Un mélange gourmand de tabac, miel et agrumes.',
    topNotes: ['Lavande', 'Bergamote', 'Citron'],
    heartNotes: ['Miel', 'Cannelle', 'Cachemire', 'Jasmin'],
    baseNotes: ['Feuilles de tabac', 'Fève tonka', 'Vanille'],
    gender: Gender.UNISEXE,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'ORIENTAL',
    sizeMl: 100,
    priceCents: 165000,
    stock: 15,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: false,
    imageSeeds: ['xerjoff-naxos-1'],
    variants: [{ sizeMl: 100, priceCents: 165000, stock: 15 }],
  },
  {
    slug: 'amouage-reflection-man',
    sku: 'AM-RM-100',
    brand: 'Amouage',
    name: 'Reflection Man',
    description: "La quintessence de l'élégance masculine. Floral boisé et poudré.",
    topNotes: ['Romarin', 'Poivre rouge', 'Feuilles de néroli'],
    heartNotes: ['Iris', 'Jasmin', 'Ylang-ylang'],
    baseNotes: ['Vétiver', 'Patchouli', 'Santal', 'Cèdre'],
    gender: Gender.HOMME,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 195000,
    stock: 12,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 2,
    isFeatured: false,
    imageSeeds: ['amouage-reflection-1'],
    variants: [
      { sizeMl: 50, priceCents: 135000, stock: 6 },
      { sizeMl: 100, priceCents: 195000, stock: 6 },
    ],
  },
  {
    slug: 'kilian-paris-love-dont-be-shy',
    sku: 'KI-LO-100',
    brand: 'Kilian Paris',
    name: "Love, Don't Be Shy",
    description: "Une gourmandise irrésistible. Guimauve, fleur d'oranger et vanille.",
    topNotes: ['Néroli', 'Bergamote', 'Poivre rose'],
    heartNotes: ['Iris', 'Jasmin', "Fleur d'oranger", 'Rose'],
    baseNotes: ['Musc', 'Vanille', 'Caramel', 'Sucre'],
    gender: Gender.FEMME,
    categorySlug: 'niche',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 50,
    priceCents: 155000,
    stock: 16,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: true,
    imageSeeds: ['kilian-love-1'],
    variants: [{ sizeMl: 50, priceCents: 155000, stock: 16 }],
  },

  // ---- DESIGNER & MODERN ----------------------------------------------------
  {
    slug: 'prada-paradoxe',
    sku: 'PR-PA-100',
    brand: 'Prada',
    name: 'Paradoxe',
    description: "L'expression de la femme aux multiples facettes. Floral et ambré.",
    topNotes: ['Poire', 'Mandarine', 'Bergamote'],
    heartNotes: ["Fleur d'oranger", 'Néroli', 'Jasmin'],
    baseNotes: ['Ambre', 'Musc blanc', 'Vanille'],
    gender: Gender.FEMME,
    categorySlug: 'news',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 90,
    priceCents: 92000,
    stock: 35,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['prada-paradoxe-1'],
    variants: [
      { sizeMl: 30, priceCents: 55000, stock: 10 },
      { sizeMl: 50, priceCents: 75000, stock: 15 },
      { sizeMl: 90, priceCents: 92000, stock: 10 },
    ],
  },
  {
    slug: 'gucci-bloom',
    sku: 'GU-BL-100',
    brand: 'Gucci',
    name: 'Bloom',
    description: 'Un jardin luxuriant. Tubéreuse, jasmin et Quisqualis indica.',
    topNotes: ['Notes vertes', 'Orange'],
    heartNotes: ['Jasmin sambac', 'Tubéreuse', 'Quisqualis indica'],
    baseNotes: ["Racine d'iris", 'Santal', 'Vanille'],
    gender: Gender.FEMME,
    categorySlug: 'designer',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 100,
    priceCents: 85000,
    stock: 28,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['gucci-bloom-1'],
    variants: [
      { sizeMl: 50, priceCents: 62000, stock: 14 },
      { sizeMl: 100, priceCents: 85000, stock: 14 },
    ],
  },
  {
    slug: 'valentino-born-in-roma',
    sku: 'VA-BR-100',
    brand: 'Valentino',
    name: 'Born in Roma',
    description: 'Une célébration de soi. Jasmin et vanille Bourbon.',
    topNotes: ['Cassis', 'Poivre rose', 'Bergamote'],
    heartNotes: ['Jasmin', 'Jasmin sambac', 'Thé au jasmin'],
    baseNotes: ['Vanille Bourbon', 'Cachemire', 'Gaïac'],
    gender: Gender.FEMME,
    categorySlug: 'news',
    concentration: 'EAU_DE_PARFUM',
    family: 'FLORAL',
    sizeMl: 100,
    priceCents: 95000,
    stock: 32,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['valentino-born-1'],
    variants: [
      { sizeMl: 30, priceCents: 55000, stock: 10 },
      { sizeMl: 50, priceCents: 75000, stock: 12 },
      { sizeMl: 100, priceCents: 95000, stock: 10 },
    ],
  },
  {
    slug: 'ysl-y-le-parfum',
    sku: 'YS-YP-100',
    brand: 'Yves Saint Laurent',
    name: 'Y Le Parfum',
    description: "La version la plus intense de Y. Pour l'homme qui n'a peur de rien.",
    topNotes: ['Pomme', 'Gingembre', 'Aldéhydes'],
    heartNotes: ['Sauge', 'Lavande', 'Géranium'],
    baseNotes: ['Cèdre', 'Patchouli', 'Fève tonka', 'Oliban'],
    gender: Gender.HOMME,
    categorySlug: 'news',
    concentration: 'PARFUM',
    family: 'BOISE',
    sizeMl: 100,
    priceCents: 85000,
    stock: 40,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['ysl-y-1'],
    variants: [
      { sizeMl: 60, priceCents: 62000, stock: 20 },
      { sizeMl: 100, priceCents: 85000, stock: 20 },
    ],
  },
  {
    slug: 'chloe-nomade',
    sku: 'CH-NO-100',
    brand: 'Chloé',
    name: 'Nomade',
    description: "L'esprit d'aventure. Mousse de chêne et mirabelle.",
    topNotes: ['Mirabelle', 'Bergamote', 'Citron'],
    heartNotes: ['Freesia', 'Jasmin', 'Pêche', 'Rose'],
    baseNotes: ['Mousse de chêne', 'Patchouli', 'Santal', 'Musc blanc'],
    gender: Gender.FEMME,
    categorySlug: 'designer',
    concentration: 'EAU_DE_PARFUM',
    family: 'CHYPRE',
    sizeMl: 75,
    priceCents: 82000,
    stock: 25,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['chloe-nomade-1'],
    variants: [
      { sizeMl: 30, priceCents: 49000, stock: 10 },
      { sizeMl: 50, priceCents: 69000, stock: 10 },
      { sizeMl: 75, priceCents: 82000, stock: 5 },
    ],
  },
  {
    slug: 'bvlgari-man-in-black',
    sku: 'BV-MB-100',
    brand: 'Bvlgari',
    name: 'Man in Black',
    description: 'Une fragrance néo-orientale. Rhum, épices et cuir.',
    topNotes: ['Rhum', 'Épices', 'Tabac'],
    heartNotes: ['Cuir', 'Iris', 'Tubéreuse'],
    baseNotes: ['Gaïac', 'Benjoin', 'Fève tonka'],
    gender: Gender.HOMME,
    categorySlug: 'designer',
    concentration: 'EAU_DE_PARFUM',
    family: 'ORIENTAL',
    sizeMl: 100,
    priceCents: 79000,
    stock: 28,
    stockStatus: StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['bvlgari-man-1'],
    variants: [
      { sizeMl: 60, priceCents: 59000, stock: 14 },
      { sizeMl: 100, priceCents: 79000, stock: 14 },
    ],
  },

  // ... (Générer le reste dynamiquement pour atteindre 100)
  ...Array.from({ length: 74 }).map((_, i) => {
    const id = i + 27;
    const isNiche = id % 3 === 0;
    const isMale = id % 2 === 0;
    const brand = isNiche
      ? ['Roja Parfums', 'Serge Lutens', "Penhaligon's", 'Aesop', 'Bond No. 9', 'Initio'][id % 6]
      : ['Givenchy', 'Guerlain', 'Cartier', 'Prada', 'Gucci', 'Versace', 'Montblanc'][id % 7];

    const families = ['FLORAL', 'BOISE', 'ORIENTAL', 'HESPERIDE', 'CHYPRE', 'AMBRE'];
    const family = families[id % families.length];

    const name = `${brand} Edition ${id}`;
    const slug = `${brand.toLowerCase().replace(/ /g, '-')}-${id}`;

    return {
      slug,
      sku: `${brand.substring(0, 2).toUpperCase()}-EX-${id}`,
      brand,
      name,
      description: `Une création d'exception de la maison ${brand}. Notes de ${family.toLowerCase()}.`,
      topNotes: ['Bergamote', 'Notes fraîches'],
      heartNotes: ['Notes de cœur', 'Épices douces'],
      baseNotes: ['Musc', 'Notes boisées'],
      gender: isMale ? Gender.HOMME : Gender.FEMME,
      categorySlug: isNiche ? 'niche' : 'designer',
      concentration: id % 4 === 0 ? 'PARFUM' : 'EAU_DE_PARFUM',
      family: family as any,
      sizeMl: 100,
      priceCents: (isNiche ? 135000 : 65000) + id * 500,
      stock: 10 + (id % 40),
      stockStatus: StockStatus.IN_STOCK,
      lowStockThreshold: 5,
      isFeatured: id % 15 === 0,
      imageSeeds: [`perfume-gen-${id}`],
      variants: [
        {
          sizeMl: 50,
          priceCents: Math.round((((isNiche ? 135000 : 65000) + id * 500) * 0.7) / 1000) * 1000,
          stock: 10 + (id % 20),
        },
        { sizeMl: 100, priceCents: (isNiche ? 135000 : 65000) + id * 500, stock: 10 + (id % 20) },
      ],
    };
  }),
];

async function seedProducts(categoryMap: Record<string, string>) {
  let created = 0;

  for (const p of PRODUCTS) {
    const categoryId = categoryMap[p.categorySlug];
    if (!categoryId) throw new Error(`Category "${p.categorySlug}" not found`);

    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });
    if (existing) {
      process.stdout.write(`  skip ${p.slug} (already exists)\n`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug: p.slug,
          sku: p.sku,
          brand: p.brand,
          name: p.name,
          description: p.description,
          storyTelling: p.storyTelling,
          topNotes: p.topNotes,
          heartNotes: p.heartNotes,
          baseNotes: p.baseNotes,
          gender: p.gender,
          categoryId,
          priceCents: p.priceCents,
          stock: p.stock,
          stockStatus: p.stockStatus,
          lowStockThreshold: p.lowStockThreshold,
          isFeatured: p.isFeatured,
          concentration: p.concentration as any,
          family: p.family as any,
          sizeMl: p.sizeMl,
          isActive: true,
          images: {
            create: p.imageSeeds.map((seed, i) => ({
              url: `https://picsum.photos/seed/${seed}/800/600`,
              alt: `${p.brand} ${p.name}`,
              position: i,
              isMain: i === 0,
            })),
          },
        },
      });

      // Variants
      if (p.variants.length > 0) {
        await tx.productVariant.createMany({
          data: p.variants.map((v) => ({
            productId: product.id,
            sizeMl: v.sizeMl,
            priceCents: v.priceCents,
            stock: v.stock,
            sku: `${p.sku}-${v.sizeMl}ML`,
          })),
        });
      }

      // Initial stock movement
      if (p.stock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            delta: p.stock,
            reason: StockReason.INITIAL,
            note: 'Stock initial — seed',
          },
        });
      }
    });

    created++;
    process.stdout.write(`  + ${p.brand} — ${p.name} (${p.slug})\n`);
  }

  process.stdout.write(`✔ Products: ${created} created, ${PRODUCTS.length - created} skipped\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  process.stdout.write('🌱 Seeding database...\n');

  await clearDatabaseExceptUsers();
  await seedUsers();

  const categories = await seedCategories();
  const categoryMap: Record<string, string> = {
    niche: categories.niche.id,
    designer: categories.designer.id,
    mass: categories.mass.id,
    best: categories.best.id,
    news: categories.news.id,
  };

  await seedProducts(categoryMap);

  process.stdout.write('✅ Seed complete.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
