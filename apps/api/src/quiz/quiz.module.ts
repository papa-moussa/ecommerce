import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';

import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [SearchModule, PrismaModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
