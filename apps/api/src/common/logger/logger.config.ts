import { randomUUID } from 'node:crypto';

import type { Params } from 'nestjs-pino';

import type { AppConfig } from '../../config/configuration';

/**
 * Pino config factory.
 * - Pretty logs in dev, JSON in prod.
 * - Adds a correlation ID (x-request-id) on each incoming request.
 * - Redacts sensitive headers.
 */
export const buildLoggerOptions = (config: AppConfig): Params => {
  const isProduction = config.NODE_ENV === 'production';

  return {
    pinoHttp: {
      level: config.LOG_LEVEL,
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      customProps: (req) => ({
        requestId: req.id,
      }),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.passwordConfirmation',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:HH:MM:ss.l',
              ignore: 'pid,hostname,req,res,responseTime',
              messageFormat: '[{requestId}] {msg}',
            },
          },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    },
  };
};
