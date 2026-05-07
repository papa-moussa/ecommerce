import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path?: string; // SEC-015: omitted in production to reduce info-disclosure
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const body = resp as { message?: string | string[]; error?: string };
        message = body.message ?? exception.message;
        error = body.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Send 5xx to Sentry only (avoid noise on 4xx validation errors)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception, {
        tags: { requestId: request.id, path: request.url },
      });
      this.logger.error(
        `[${request.id ?? '-'}] ${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // SEC-015: mask path in production — prevents route structure enumeration
    const isDev = process.env['NODE_ENV'] !== 'production';

    const body: ErrorResponse = {
      statusCode: status,
      message,
      ...(error && { error }),
      timestamp: new Date().toISOString(),
      ...(isDev && { path: request.url }),
      requestId: request.id,
    };

    response.status(status).json(body);
  }
}
