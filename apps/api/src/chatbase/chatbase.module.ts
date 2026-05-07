import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ChatbaseController } from './chatbase.controller';
import { ChatbaseService } from './chatbase.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbaseController],
  providers: [ChatbaseService],
})
export class ChatbaseModule {}
