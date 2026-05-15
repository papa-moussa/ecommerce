import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  Body,
  Controller,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { Public } from '../common/decorators/public.decorator';
import type { AppConfig } from '../config/configuration';

// HIGH-01 (Audit-2): HMAC-SHA256 signature verification before any business logic
@Controller('shipping')
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Body() payload: unknown) {
    const secret = this.config.get('SHIPPING_WEBHOOK_SECRET', { infer: true });

    if (secret) {
      const sigHeader = req.headers['x-shipping-signature'] as string | undefined;
      if (!sigHeader) {
        throw new UnauthorizedException('Missing x-shipping-signature header');
      }

      const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(payload));
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

      let provided: Buffer;
      try {
        provided = Buffer.from(sigHeader, 'hex');
      } catch {
        throw new UnauthorizedException('Invalid signature format');
      }

      const expectedBuf = Buffer.from(expected, 'hex');
      if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
        this.logger.warn(`[HIGH-01] Shipping webhook signature mismatch — rejecting`);
        throw new UnauthorizedException('Invalid signature');
      }
    } else {
      this.logger.warn(
        '[HIGH-01] SHIPPING_WEBHOOK_SECRET not set — signature verification skipped (set it before adding business logic)',
      );
    }

    this.logger.log(`Received shipping webhook: ${JSON.stringify(payload)}`);

    // Stub for future transporteur integration (ex: Colissimo, DHL)
    // 1. ✅ Signature verified above
    // 2. Map payload status to OrderStatus
    // 3. Update order in DB

    return { received: true };
  }
}
