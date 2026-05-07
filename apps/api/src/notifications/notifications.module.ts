import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { MailService } from './mail.service';
import { NotificationsService } from './notifications.service';
import { TwilioService } from './twilio.service';

@Module({
  imports: [PrismaModule],
  providers: [MailService, NotificationsService, TwilioService],
  exports: [MailService, NotificationsService, TwilioService],
})
export class NotificationsModule {}
