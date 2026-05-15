import { Body, Controller, Post } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizService } from './quiz.service';

// HIGH-05 (Audit-2): replaced `answers: any` with typed DTO to prevent Algolia filter injection
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Public()
  @Post('submit')
  async submit(@CurrentUser() user: User | null, @Body() answers: SubmitQuizDto) {
    return this.quizService.submit(user?.id ?? null, answers);
  }
}
