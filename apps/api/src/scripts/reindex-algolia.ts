import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { configuration } from '../config/configuration';
import { validateEnv } from '../config/env.validation';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { SearchModule } from '../search/search.module';
import { SearchService } from '../search/search.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext({
    module: class {},
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
        validate: validateEnv,
      }),
      PrismaModule,
      SearchModule,
    ],
  });

  const searchService = app.get(SearchService);
  const prisma = app.get(PrismaService);

  console.log('Fetching all active products...');
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: { where: { isMain: true }, take: 1 },
      variants: true,
    },
  });

  console.log(`Found ${products.length} products. Syncing to Algolia...`);
  await searchService.syncAllProducts(products);

  console.log('Reindexing complete.');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Reindexing failed', err);
  process.exit(1);
});
