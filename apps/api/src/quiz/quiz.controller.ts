import { Body, Controller, Post } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

import { QuizService } from './quiz.service';


@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Public()
  @Post('submit')
  async submit(@CurrentUser() user: User | null, @Body() answers: any) {
    return this.quizService.submit(user?.id ?? null, answers);
  }
}
