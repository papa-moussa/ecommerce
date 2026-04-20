import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { type RawBodyRequest } from '@nestjs/common';
import { type Request } from 'express';

import { Public } from '../common/decorators/public.decorator';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: RawBodyRequest<Request>): Promise<{ received: boolean }> {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new Error('Missing raw body — ensure rawBody: true is set in NestFactory.create()');
    }

    if (!signature || typeof signature !== 'string') {
      throw new Error('Missing stripe-signature header');
    }

    await this.paymentsService.handleWebhook(rawBody, signature);

    return { received: true };
  }
}
