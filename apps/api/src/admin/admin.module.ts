import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PaymentsModule,
    NotificationsModule,
    SearchModule,
    JobsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditLogInterceptor, Reflector],
})
export class AdminModule {}
