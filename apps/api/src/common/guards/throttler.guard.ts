import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { type Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse<Response>();
    const retryAfter = Math.ceil(throttlerLimitDetail.timeToExpire / 1000);
    res.setHeader('Retry-After', retryAfter);
    throw new ThrottlerException();
  }
}
