import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class QuizService {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  async submit(userId: string | null, answers: any) {
    const hits = await this.searchService.recommend(answers); // I'll need to re-add recommend to SearchService but maybe private or internal
    // Wait, I just removed it. I should have moved it to a shared place or just put the logic here if it uses Algolia client directly.
    // Actually, it's better to have SearchService provide a search method, and QuizService uses it.

    // I'll re-add a generic search/filter method to SearchService.

    const productIds = hits.map((h: any) => h.objectID);

    // Save result in DB (T6.8)
    await this.prisma.quizResult.create({
      data: {
        userId,
        answers,
        recommendations: productIds,
      },
    });

    return hits;
  }
}
