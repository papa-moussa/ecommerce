import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, ConfigModule, PaymentsModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, AuditLogInterceptor, Reflector],
})
export class AdminModule {}
