import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: User | null, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user?.id ?? null, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.ordersService.findAllForUser(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@CurrentUser() user: User | null, @Param('id') id: string) {
    if (user) {
      return this.ordersService.findOneForUser(user.id, id);
    }
    return this.ordersService.findOneForGuest(id);
  }
}
