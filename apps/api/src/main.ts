// Sentry init must run FIRST — before any other import.
import './instrument';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  app.useLogger(app.get(Logger));
  app.flushLogs();

  const config = app.get(ConfigService<AppConfig, true>);

  // SEC-012: trust the first downstream reverse proxy (Caddy/Nginx) so that
  // req.ip returns the real client IP from X-Forwarded-For, not the proxy IP.
  // Value `1` = trust exactly one hop — prevents IP spoofing via XFF headers.
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set('trust proxy', 1);

  app.use(cookieParser());

  // SEC-011: explicit Content Security Policy scoped to known third-party origins.
  // Replaces the default Helmet CSP that is too permissive and doesn't allow
  // Stripe, Cloudinary, Algolia or Sentry.
  const algoliaAppId = config.get('ALGOLIA_APP_ID', { infer: true });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://js.stripe.com'],
          scriptSrcElem: ["'self'", 'https://js.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com'],
          connectSrc: [
            "'self'",
            'https://api.stripe.com',
            ...(algoliaAppId
              ? [`https://${algoliaAppId}-dsn.algolia.net`, `https://${algoliaAppId}.algolia.net`]
              : []),
            'https://o*.ingest.sentry.io',
            'https://res.cloudinary.com',
            'https://api.cloudinary.com',
          ],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://stripe.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }), {
    exclude: ['health', 'health/(.*)'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`🚀 API listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
