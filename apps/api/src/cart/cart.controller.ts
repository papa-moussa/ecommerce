import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { CartService } from './cart.service';
import { SyncCartDto } from './dto/sync-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(@CurrentUser() user: User, @Body() dto: SyncCartDto) {
    return this.cartService.sync(user.id, undefined, dto.items);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@CurrentUser() user: User) {
    return this.cartService.validate(user.id, undefined);
  }

  @Post('recover')
  @HttpCode(HttpStatus.OK)
  recover(@CurrentUser() user: User, @Body('token') token: string) {
    return this.cartService.recover(user.id, token);
  }
}
