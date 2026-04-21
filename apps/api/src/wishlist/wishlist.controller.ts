import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.wishlistService.findAll(user.id);
  }

  @Post(':productId')
  add(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.wishlistService.add(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.wishlistService.remove(user.id, productId);
  }
}
