import { Body, Controller, Post, Logger, Headers } from '@nestjs/common';

import { Public } from '../common/decorators/public.decorator';

@Controller('shipping')
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  @Public()
  @Post('webhook')
  async handleWebhook(@Headers('x-shipping-signature') _signature: string, @Body() payload: any) {
    this.logger.log(`Received shipping webhook: ${JSON.stringify(payload)}`);

    // Stub for future transporteur integration (ex: Colissimo, DHL)
    // 1. Verify signature
    // 2. Map payload status to OrderStatus
    // 3. Update order in DB

    return { received: true };
  }
}
