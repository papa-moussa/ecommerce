'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const bcrypt = __importStar(require('bcrypt'));
const prisma = new client_1.PrismaClient();
const BCRYPT_ROUNDS = 12;
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
        role: client_1.Role.ADMIN,
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
        role: client_1.Role.CUSTOMER,
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
        role: client_1.Role.CUSTOMER,
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
      where: { slug: 'femme' },
      update: {},
      create: {
        slug: 'femme',
        name: 'Femme',
        description: 'Fragrances féminines — florales, orientales et boisées.',
        imageUrl: 'https://picsum.photos/seed/femme/800/600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'homme' },
      update: {},
      create: {
        slug: 'homme',
        name: 'Homme',
        description: 'Fragrances masculines — aromatiques, aquatiques et boisées.',
        imageUrl: 'https://picsum.photos/seed/homme/800/600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'unisexe' },
      update: {},
      create: {
        slug: 'unisexe',
        name: 'Unisexe',
        description: 'Fragrances mixtes — au-delà des genres.',
        imageUrl: 'https://picsum.photos/seed/unisexe/800/600',
      },
    }),
  ]);
  process.stdout.write(`✔ Categories: ${categories.map((c) => c.slug).join(', ')}\n`);
  return { femme: categories[0], homme: categories[1], unisexe: categories[2] };
}
const PRODUCTS = [
  // ---- FEMME ----------------------------------------------------------------
  {
    slug: 'chanel-n5',
    sku: 'CH-N5-001',
    brand: 'Chanel',
    name: 'N°5',
    description:
      'Le parfum le plus célèbre au monde. Une composition florale aldéhydée intemporelle.',
    storyTelling:
      'En 1921, Gabrielle Chanel demande au parfumeur Ernest Beaux de créer un parfum révolutionnaire. Numéro 5 devient une icône absolue.',
    topNotes: ['Aldéhydes', 'Néroli', 'Ylang-ylang'],
    heartNotes: ['Rose de mai', 'Jasmin', 'Iris'],
    baseNotes: ['Vétiver', 'Santal', 'Vanille', 'Musc blanc'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 14500,
    stock: 42,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['chanel-n5-1', 'chanel-n5-2'],
    variants: [
      { sizeMl: 30, priceCents: 9500, stock: 15 },
      { sizeMl: 50, priceCents: 14500, stock: 18 },
      { sizeMl: 100, priceCents: 21000, stock: 9 },
    ],
  },
  {
    slug: 'dior-jadore',
    sku: 'DI-JA-001',
    brand: 'Dior',
    name: "J'adore",
    description: 'Un bouquet floral lumineux et sensuel signé Christian Dior.',
    topNotes: ['Poire', 'Melon', 'Pêche', 'Bergamote'],
    heartNotes: ['Rose', 'Violette', 'Orchidée', 'Jasmin'],
    baseNotes: ['Mûre', 'Vanille', 'Musc'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 12000,
    stock: 35,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['dior-jadore-1', 'dior-jadore-2'],
    variants: [
      { sizeMl: 30, priceCents: 8500, stock: 12 },
      { sizeMl: 50, priceCents: 12000, stock: 15 },
      { sizeMl: 100, priceCents: 17500, stock: 8 },
    ],
  },
  {
    slug: 'ysl-black-opium',
    sku: 'YS-BO-001',
    brand: 'Yves Saint Laurent',
    name: 'Black Opium',
    description: 'Un accord gourmand et addictif autour du café et de la vanille.',
    topNotes: ['Poire', 'Framboise', 'Mandarine rose'],
    heartNotes: ['Café', 'Fleur blanche', 'Jasmin'],
    baseNotes: ['Vanille', 'Patchouli', 'Cèdre'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 10500,
    stock: 28,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['ysl-black-opium-1', 'ysl-black-opium-2'],
    variants: [
      { sizeMl: 30, priceCents: 7000, stock: 10 },
      { sizeMl: 50, priceCents: 10500, stock: 12 },
      { sizeMl: 90, priceCents: 14000, stock: 6 },
    ],
  },
  {
    slug: 'tom-ford-black-orchid',
    sku: 'TF-BO-001',
    brand: 'Tom Ford',
    name: 'Black Orchid',
    description: 'Une fragrance luxueuse et mystérieuse aux notes florales noires et boisées.',
    topNotes: ['Truffe noire', 'Ylang-ylang', 'Bergamote'],
    heartNotes: ['Orchidée noire', 'Lotus', 'Fruit de la passion'],
    baseNotes: ['Patchouli', 'Vétiver', 'Santal', 'Vanille'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 18500,
    stock: 20,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['tom-ford-black-orchid-1', 'tom-ford-black-orchid-2'],
    variants: [
      { sizeMl: 30, priceCents: 12000, stock: 8 },
      { sizeMl: 50, priceCents: 18500, stock: 8 },
      { sizeMl: 100, priceCents: 27000, stock: 4 },
    ],
  },
  {
    slug: 'givenchy-linterdit',
    sku: 'GI-LI-001',
    brand: 'Givenchy',
    name: "L'Interdit",
    description: 'Un parfum floral boisé qui célèbre la dualité de la femme moderne.',
    topNotes: ['Poire', 'Bergamote'],
    heartNotes: ['Fleur blanche', 'Rose', 'Vétiver'],
    baseNotes: ['Patchouli', 'Santal', 'Vétiver fumé'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 9500,
    stock: 30,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['givenchy-linterdit-1'],
    variants: [
      { sizeMl: 35, priceCents: 7000, stock: 12 },
      { sizeMl: 50, priceCents: 9500, stock: 10 },
      { sizeMl: 80, priceCents: 13000, stock: 8 },
    ],
  },
  {
    slug: 'guerlain-mon-guerlain',
    sku: 'GU-MG-001',
    brand: 'Guerlain',
    name: 'Mon Guerlain',
    description: 'Une lavande provençale sublimée par une vanille gourmande et sensuelle.',
    topNotes: ['Bergamote', 'Lavande'],
    heartNotes: ['Lavande', 'Jasmin sambac', 'Iris'],
    baseNotes: ['Santalum', 'Vanille Tahitensis', 'Musc'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 10000,
    stock: 25,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['guerlain-mon-guerlain-1'],
    variants: [
      { sizeMl: 30, priceCents: 6500, stock: 10 },
      { sizeMl: 50, priceCents: 10000, stock: 10 },
      { sizeMl: 100, priceCents: 14500, stock: 5 },
    ],
  },
  {
    slug: 'guerlain-shalimar',
    sku: 'GU-SH-001',
    brand: 'Guerlain',
    name: 'Shalimar',
    description: "L'icône orientale de Guerlain, une ode à l'amour éternel.",
    storyTelling:
      'Inspiré des jardins de Shalimar au Cachemire, ce parfum créé en 1925 reste une référence absolue de la parfumerie orientale.',
    topNotes: ['Bergamote', 'Citron', 'Mandarine'],
    heartNotes: ['Rose', 'Jasmin', 'Iris', 'Vétiver'],
    baseNotes: ['Benjoin', 'Opoponax', 'Vanille', 'Cuir'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 11500,
    stock: 4,
    stockStatus: client_1.StockStatus.LOW_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['guerlain-shalimar-1'],
    variants: [
      { sizeMl: 30, priceCents: 7500, stock: 2 },
      { sizeMl: 50, priceCents: 11500, stock: 2 },
    ],
  },
  {
    slug: 'narciso-rodriguez-for-her',
    sku: 'NR-FH-001',
    brand: 'Narciso Rodriguez',
    name: 'For Her',
    description: 'Un musc nu, sensuel et moderne — la peau comme un parfum.',
    topNotes: ['Violette', 'Rose osmanthus'],
    heartNotes: ['Musc', 'Rose', 'Iris'],
    baseNotes: ['Musc ambré', 'Vétiver', 'Patchouli'],
    gender: client_1.Gender.FEMME,
    categorySlug: 'femme',
    priceCents: 8500,
    stock: 3,
    stockStatus: client_1.StockStatus.LOW_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['narciso-rodriguez-1'],
    variants: [
      { sizeMl: 30, priceCents: 5500, stock: 1 },
      { sizeMl: 50, priceCents: 8500, stock: 2 },
    ],
  },
  // ---- HOMME ----------------------------------------------------------------
  {
    slug: 'dior-sauvage',
    sku: 'DI-SA-001',
    brand: 'Dior',
    name: 'Sauvage',
    description: 'Un parfum masculin intense et sauvage, inspiré des grands espaces.',
    storyTelling:
      "Sauvage est un cri vers le ciel. Un parfum radical et noble, inspiré des grands espaces désertiques et de l'air du soir.",
    topNotes: ['Bergamote de Calabre', 'Poivre'],
    heartNotes: ['Lavande', 'Poivre de Sichuan', 'Géranium', 'Vétiver', 'Patchouli'],
    baseNotes: ['Ambre', 'Cèdre', 'Labdanum'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 11000,
    stock: 50,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['dior-sauvage-1', 'dior-sauvage-2'],
    variants: [
      { sizeMl: 60, priceCents: 8500, stock: 20 },
      { sizeMl: 100, priceCents: 11000, stock: 20 },
      { sizeMl: 200, priceCents: 18000, stock: 10 },
    ],
  },
  {
    slug: 'chanel-bleu-de-chanel',
    sku: 'CH-BC-001',
    brand: 'Chanel',
    name: 'Bleu de Chanel',
    description: 'Un boisé aromatique affirmé et sensuel, un parfum pour les hommes libres.',
    topNotes: ['Pamplemousse', 'Citron', 'Menthe'],
    heartNotes: ['Gingembre', 'Noix de muscade', 'Jasmin', 'Iso E Super'],
    baseNotes: ['Cèdre', 'Santal', 'Labdanum', 'Vétiver', 'Encens'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 12500,
    stock: 38,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['chanel-bleu-1', 'chanel-bleu-2'],
    variants: [
      { sizeMl: 50, priceCents: 9500, stock: 15 },
      { sizeMl: 100, priceCents: 12500, stock: 15 },
      { sizeMl: 150, priceCents: 17000, stock: 8 },
    ],
  },
  {
    slug: 'ysl-la-nuit-de-lhomme',
    sku: 'YS-LN-001',
    brand: 'Yves Saint Laurent',
    name: "La Nuit de L'Homme",
    description: 'Un parfum oriental épicé, sensuel et magnétique pour les nuits audacieuses.',
    topNotes: ['Cardamome', 'Bergamote'],
    heartNotes: ['Cèdre de Virginie', 'Vétiver', 'Lavande'],
    baseNotes: ['Coumarine', 'Fève tonka', 'Musc'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 9500,
    stock: 32,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['ysl-la-nuit-1'],
    variants: [
      { sizeMl: 40, priceCents: 6500, stock: 12 },
      { sizeMl: 60, priceCents: 9500, stock: 12 },
      { sizeMl: 100, priceCents: 13000, stock: 8 },
    ],
  },
  {
    slug: 'hermes-terre-dhermes',
    sku: 'HE-TH-001',
    brand: 'Hermès',
    name: "Terre d'Hermès",
    description: 'Un voyage olfactif entre ciel et terre, minéral et boisé.',
    topNotes: ['Pamplemousse', 'Orange'],
    heartNotes: ['Poivre', 'Géranium', 'Flint (silex)'],
    baseNotes: ['Vétiver', 'Patchouli', 'Cèdre', 'Benjoin'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 13500,
    stock: 22,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['hermes-terre-1'],
    variants: [
      { sizeMl: 50, priceCents: 9500, stock: 9 },
      { sizeMl: 100, priceCents: 13500, stock: 9 },
      { sizeMl: 200, priceCents: 19500, stock: 4 },
    ],
  },
  {
    slug: 'paco-rabanne-1-million',
    sku: 'PR-1M-001',
    brand: 'Paco Rabanne',
    name: '1 Million',
    description: "Un parfum audacieux et séducteur aux accords de cuir et d'épices dorées.",
    topNotes: ['Mandarine', 'Pamplemousse', 'Menthe'],
    heartNotes: ['Rose', 'Cannelle', 'Épices'],
    baseNotes: ['Cuir', 'Ambre gris', 'Patchouli', 'Bois de cèdre'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 9000,
    stock: 40,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['paco-1million-1'],
    variants: [
      { sizeMl: 50, priceCents: 7000, stock: 15 },
      { sizeMl: 100, priceCents: 9000, stock: 15 },
      { sizeMl: 200, priceCents: 13500, stock: 10 },
    ],
  },
  {
    slug: 'creed-aventus',
    sku: 'CR-AV-001',
    brand: 'Creed',
    name: 'Aventus',
    description: 'Le parfum de référence pour hommes ambitieux — fruité, boisé et fumé.',
    storyTelling:
      "Inspiré par la vie tumultueuse de Napoléon Bonaparte, Aventus célèbre la force, le succès et l'héritage.",
    topNotes: ['Ananas', 'Bergamote', 'Cassis', 'Pomme'],
    heartNotes: ['Bouleau', 'Jasmin', 'Rose sèche', 'Patchouli'],
    baseNotes: ['Musc', 'Oakmoss', 'Ambre gris', 'Vétiver'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 38000,
    stock: 15,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: true,
    imageSeeds: ['creed-aventus-1', 'creed-aventus-2'],
    variants: [
      { sizeMl: 50, priceCents: 24000, stock: 6 },
      { sizeMl: 100, priceCents: 38000, stock: 6 },
      { sizeMl: 250, priceCents: 72000, stock: 3 },
    ],
  },
  {
    slug: 'givenchy-gentleman',
    sku: 'GI-GE-001',
    brand: 'Givenchy',
    name: 'Gentleman',
    description: 'Un fougère aromatique élégant qui réinvente la masculinité moderne.',
    topNotes: ['Bergamote', 'Pamplemousse', 'Cardamome'],
    heartNotes: ['Iris', 'Patchouli', 'Vétiver'],
    baseNotes: ['Cuir', 'Cèdre', 'Ambre'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 8500,
    stock: 28,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['givenchy-gentleman-1'],
    variants: [
      { sizeMl: 50, priceCents: 6500, stock: 12 },
      { sizeMl: 100, priceCents: 8500, stock: 10 },
      { sizeMl: 150, priceCents: 12000, stock: 6 },
    ],
  },
  {
    slug: 'acqua-di-gio',
    sku: 'GI-AG-001',
    brand: 'Giorgio Armani',
    name: 'Acqua di Giò',
    description: 'Un hymne à la mer Méditerranée, aquatique, frais et vivifiant.',
    topNotes: ['Citron', 'Lime', 'Bergamote', 'Néroli'],
    heartNotes: ['Marine accord', 'Jasmin', 'Persimmon', 'Calone'],
    baseNotes: ['Cèdre', 'Patchouli', 'Musc blanc'],
    gender: client_1.Gender.HOMME,
    categorySlug: 'homme',
    priceCents: 8500,
    stock: 0,
    stockStatus: client_1.StockStatus.OUT_OF_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['acqua-di-gio-1'],
    variants: [
      { sizeMl: 50, priceCents: 6000, stock: 0 },
      { sizeMl: 100, priceCents: 8500, stock: 0 },
    ],
  },
  // ---- UNISEXE --------------------------------------------------------------
  {
    slug: 'tom-ford-oud-wood',
    sku: 'TF-OW-001',
    brand: 'Tom Ford',
    name: 'Oud Wood',
    description: 'Un boisé oriental rare et précieux, autour du bois de oud.',
    storyTelling:
      "Le bois de oud est l'une des matières premières les plus précieuses et convoitées au monde. Tom Ford en livre ici une interprétation raffinée et moderne.",
    topNotes: ['Oud', 'Palissandre', 'Cardamome'],
    heartNotes: ['Bois de santal', 'Vétiver', 'Tonka'],
    baseNotes: ['Ambre', 'Musc', 'Vanille'],
    gender: client_1.Gender.UNISEXE,
    categorySlug: 'unisexe',
    priceCents: 28000,
    stock: 18,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 3,
    isFeatured: false,
    imageSeeds: ['tom-ford-oud-1', 'tom-ford-oud-2'],
    variants: [
      { sizeMl: 30, priceCents: 18000, stock: 6 },
      { sizeMl: 50, priceCents: 28000, stock: 8 },
      { sizeMl: 100, priceCents: 45000, stock: 4 },
    ],
  },
  {
    slug: 'maison-margiela-jazz-club',
    sku: 'MM-JC-001',
    brand: 'Maison Margiela',
    name: 'Replica Jazz Club',
    description: "Le souvenir olfactif d'un club de jazz new-yorkais — tabac, rhum et vanille.",
    topNotes: ['Néroli', 'Bergamote', 'Poivre rose'],
    heartNotes: ['Feuille de violette', 'Vétiver', 'Gaïac'],
    baseNotes: ['Tabac virginie', 'Vanille', 'Rhum'],
    gender: client_1.Gender.UNISEXE,
    categorySlug: 'unisexe',
    priceCents: 15500,
    stock: 24,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: true,
    imageSeeds: ['margiela-jazz-1', 'margiela-jazz-2'],
    variants: [
      { sizeMl: 30, priceCents: 9500, stock: 8 },
      { sizeMl: 100, priceCents: 15500, stock: 12 },
      { sizeMl: 200, priceCents: 25000, stock: 4 },
    ],
  },
  {
    slug: 'jo-malone-peony-blush-suede',
    sku: 'JM-PB-001',
    brand: 'Jo Malone',
    name: 'Peony & Blush Suede',
    description: 'Un bouquet de pivoines fraîches posé sur un fond de suède poudré.',
    topNotes: ['Pomme rouge'],
    heartNotes: ['Pivoine', 'Jasmin', 'Rose'],
    baseNotes: ['Suède', 'Vétiver', 'Poire'],
    gender: client_1.Gender.UNISEXE,
    categorySlug: 'unisexe',
    priceCents: 14000,
    stock: 20,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['jo-malone-peony-1'],
    variants: [
      { sizeMl: 30, priceCents: 8500, stock: 8 },
      { sizeMl: 100, priceCents: 14000, stock: 12 },
    ],
  },
  {
    slug: 'diptyque-philosykos',
    sku: 'DI-PH-001',
    brand: 'Diptyque',
    name: 'Philosykos',
    description: 'Un figuier méditerranéen sous le soleil de midi — bois, feuilles et fruit.',
    topNotes: ['Feuille de figuier', 'Bois de figuier'],
    heartNotes: ['Figue', 'Lait de figuier'],
    baseNotes: ['Bois blanc', 'Cèdre'],
    gender: client_1.Gender.UNISEXE,
    categorySlug: 'unisexe',
    priceCents: 13500,
    stock: 16,
    stockStatus: client_1.StockStatus.IN_STOCK,
    lowStockThreshold: 5,
    isFeatured: false,
    imageSeeds: ['diptyque-filosykos-1'],
    variants: [
      { sizeMl: 50, priceCents: 10000, stock: 8 },
      { sizeMl: 75, priceCents: 13500, stock: 8 },
    ],
  },
];
async function seedProducts(categoryMap) {
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
            reason: client_1.StockReason.INITIAL,
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
  await seedUsers();
  const categories = await seedCategories();
  const categoryMap = {
    femme: categories.femme.id,
    homme: categories.homme.id,
    unisexe: categories.unisexe.id,
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
//# sourceMappingURL=seed.js.map
