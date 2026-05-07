import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

import { type AppConfig } from '../config/configuration';

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name);
  private client: Twilio | null = null;
  private fromWhatsApp!: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit() {
    const sid = this.config.get('TWILIO_ACCOUNT_SID', { infer: true });
    const token = this.config.get('TWILIO_AUTH_TOKEN', { infer: true });
    this.fromWhatsApp = this.config.get('TWILIO_WHATSAPP_FROM', { infer: true });

    if (sid && token) {
      this.client = new Twilio(sid, token);
      this.logger.log('Twilio WhatsApp provider initialized');
    } else {
      this.logger.warn('Twilio credentials missing, WhatsApp messages will be simulated');
    }
  }

  async sendWhatsApp(to: string, message: string) {
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const from = this.fromWhatsApp.startsWith('whatsapp:')
      ? this.fromWhatsApp
      : `whatsapp:${this.fromWhatsApp}`;

    try {
      if (this.client) {
        await this.client.messages.create({
          from,
          to: toWhatsApp,
          body: message,
        });
        this.logger.log(`WhatsApp sent to ${toWhatsApp}`);
      } else {
        this.logger.log(`[SIMULATION] WhatsApp to ${toWhatsApp}: ${message}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp to ${toWhatsApp}`, err);
    }
  }
}
