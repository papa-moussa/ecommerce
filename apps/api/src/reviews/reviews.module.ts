import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, AuditLogInterceptor, Reflector],
})
export class ReviewsModule {}
