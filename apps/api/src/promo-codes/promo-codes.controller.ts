import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';
import { PromoCodesService } from './promo-codes.service';

export class ApplyPromoDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  subtotalCents!: number;
}

@Controller()
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Public()
  @Post('cart/apply-promo')
  async applyPromo(
    @Body() applyPromoDto: ApplyPromoDto,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.promoCodesService.applyPromo(
      applyPromoDto.code,
      user?.id || null,
      applyPromoDto.subtotalCents,
    );
  }

  // Admin Routes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/promo-codes')
  create(@Body() createPromoCodeDto: CreatePromoCodeDto) {
    return this.promoCodesService.create(createPromoCodeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/promo-codes')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.promoCodesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/promo-codes/:id')
  findOne(@Param('id') id: string) {
    return this.promoCodesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/promo-codes/:id')
  update(@Param('id') id: string, @Body() updatePromoCodeDto: UpdatePromoCodeDto) {
    return this.promoCodesService.update(id, updatePromoCodeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/promo-codes/:id')
  remove(@Param('id') id: string) {
    return this.promoCodesService.remove(id);
  }
}
