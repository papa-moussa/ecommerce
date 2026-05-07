import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';

@Processor('products')
export class ProductsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsQueueProcessor.name);

  constructor(
    private readonly search: SearchService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case 'sync-product':
        return this.handleSync(job.data.productId);
      case 'delete-product':
        return this.handleDelete(job.data.productId);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleSync(productId: string) {
    this.logger.log(`Syncing product ${productId} to Algolia`);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { where: { isMain: true }, take: 1 },
      },
    });

    if (!product) {
      this.logger.warn(`Product ${productId} not found for sync`);
      return;
    }

    await this.search.saveProduct(product);
  }

  private async handleDelete(productId: string) {
    this.logger.log(`Deleting product ${productId} from Algolia`);
    await this.search.deleteProduct(productId);
  }
}
