import { Controller, Post, Get } from '@nestjs/common';

import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
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

  @Public()
  @Get('test')
  test() {
    return { ok: true };
  }
}
