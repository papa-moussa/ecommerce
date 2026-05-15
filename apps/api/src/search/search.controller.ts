import { Controller, Post } from '@nestjs/common';

import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

import { SearchService } from './search.service';

// CRIT-02 (Audit-2): reindex is ADMIN-only — removed @Public() + debug test endpoint
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  @Roles('ADMIN')
  @Post('reindex')
  async reindex() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { where: { isMain: true }, take: 1 },
      },
    });

    await this.searchService.syncAllProducts(products);
    return { synced: products.length };
  }
}
