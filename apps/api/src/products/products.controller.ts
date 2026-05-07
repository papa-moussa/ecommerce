import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';

import { Public } from '../common/decorators/public.decorator';
import { HttpCacheInterceptor } from '../common/interceptors/http-cache.interceptor';

import { ListProductsDto } from './dto/list-products.dto';
import { ProductsService } from './products.service';

@Public()
@UseInterceptors(HttpCacheInterceptor)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() dto: ListProductsDto) {
    return this.productsService.findAll(dto);
  }

  @Get('featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get('bestsellers')
  findBestsellers() {
    return this.productsService.findBestsellers();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id/related')
  findRelated(@Param('id') id: string) {
    return this.productsService.findRelated(id);
  }
}
