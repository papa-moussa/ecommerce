import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';

import { AuditResource } from '../common/decorators/audit-resource.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';

import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public — approved reviews for a product
  @Get('products/:productId/reviews')
  listProductReviews(@Param('productId') productId: string, @Query('page') page?: string) {
    return this.reviewsService.listProductReviews(productId, page ? parseInt(page, 10) : 1);
  }

  // Authenticated — post a review (must have DELIVERED order)
  @Post('products/:productId/reviews')
  @HttpCode(HttpStatus.CREATED)
  createReview(
    @Param('productId') productId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(productId, user.id, dto);
  }

  // Admin moderation
  @Roles('ADMIN')
  @UseInterceptors(AuditLogInterceptor)
  @Get('admin/reviews')
  listPendingReviews(@Query('page') page?: string) {
    return this.reviewsService.listPendingReviews(page ? parseInt(page, 10) : 1);
  }

  @Roles('ADMIN')
  @UseInterceptors(AuditLogInterceptor)
  @Patch('admin/reviews/:id/approve')
  @AuditResource({ resource: 'review', action: 'review.approve', idParam: 'id' })
  approveReview(@Param('id') id: string) {
    return this.reviewsService.approveReview(id);
  }

  @Roles('ADMIN')
  @UseInterceptors(AuditLogInterceptor)
  @Delete('admin/reviews/:id')
  @AuditResource({ resource: 'review', action: 'review.delete', idParam: 'id' })
  deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
