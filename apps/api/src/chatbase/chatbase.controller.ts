import { Controller, Get, Header, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { ChatbaseService } from './chatbase.service';

@Controller('chatbase')
export class ChatbaseController {
  constructor(
    private readonly chatbaseService: ChatbaseService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Endpoint appelé manuellement (ou via cron) pour régénérer le fichier
   * texte à uploader dans Chatbase > Sources > Text.
   * Protégé par la même clé API admin.
   */
  @Get('knowledge-base.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async exportKnowledgeBase(@Res() res: Response) {
    const secret = this.config.get<string>('CHATBASE_SYNC_SECRET');
    const authHeader = res.req.headers['x-sync-secret'];
    // MED-08 (Audit-2): condition was `secret && ...` which bypassed auth when secret was empty
    if (!secret || authHeader !== secret) throw new UnauthorizedException();

    const content = await this.chatbaseService.exportKnowledgeBase();
    res.setHeader('Content-Disposition', 'attachment; filename="knowledge-base.txt"');
    res.send(content);
  }
}
