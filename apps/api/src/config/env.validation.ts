import { z } from 'zod';

/**
 * Strict validation of environment variables at boot.
 * Fail fast — if any required env is missing or malformed, the process exits.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    API_PREFIX: z.string().default('api'),
    CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    // SEC-022: RS256 asymmetric key pair — private key signs, public key verifies.
    // Stored as PEM strings with literal \n (replace '\\n' → '\n' before use).
    JWT_PRIVATE_KEY: z
      .string()
      .min(1)
      .transform((v) => v.replace(/\\n/g, '\n')),
    JWT_PUBLIC_KEY: z
      .string()
      .min(1)
      .transform((v) => v.replace(/\\n/g, '\n')),

    // SEC-022: JWT_ACCESS_SECRET is deprecated in favour of RS256 keys above.
    // Kept optional so existing .env files and CI configs continue to work
    // without change. Will be removed in a future cleanup sprint.
    JWT_ACCESS_SECRET: z.string().optional().default(''),
    JWT_REFRESH_SECRET: z.string().min(32),
    // SEC-002: Separate secret for 2FA temp tokens — prevents a tempToken from
    // being accepted as a full accessToken by jwt.strategy.ts (defense-in-depth).
    JWT_TEMP_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Stripe
    // SEC-010: sk_test_ keys are blocked in production at boot time (see superRefine below)
    STRIPE_SECRET_KEY: z.string().min(1),
    // SEC-005: must be a real whsec_ secret (not the placeholder) — validated in superRefine
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').min(10),

    // SMTP (Mailhog in dev, Resend / SES in prod)
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_SECURE: z
      .string()
      .default('false')
      .transform((v) => v === 'true'),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    SMTP_FROM: z.string().email().default('noreply@maisonparfum.local'),
    RESEND_API_KEY: z.string().optional().default(''),

    APP_URL: z.string().url().default('http://localhost:3002'),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    SENTRY_DSN: z.string().optional().default(''),
    SENTRY_ENVIRONMENT: z.string().default('development'),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

    // Cloudinary (upload signing — Sprint 3)
    CLOUDINARY_CLOUD_NAME: z.string().default(''),
    CLOUDINARY_API_KEY: z.string().default(''),
    CLOUDINARY_API_SECRET: z.string().default(''),

    // Algolia (Sprint 6)
    ALGOLIA_APP_ID: z.string().optional().default(''),
    ALGOLIA_API_KEY: z.string().optional().default(''),
    ALGOLIA_SEARCH_KEY: z.string().optional().default(''),

    // Twilio (WhatsApp - Sprint 6)
    TWILIO_ACCOUNT_SID: z.string().optional().default(''),
    TWILIO_AUTH_TOKEN: z.string().optional().default(''),
    TWILIO_WHATSAPP_FROM: z.string().optional().default(''),

    // Chatbase
    CHATBASE_SYNC_SECRET: z.string().optional().default(''),

    // HIGH-04 (Audit-2): HMAC secret for signed unsubscribe links — required in prod
    UNSUBSCRIBE_SECRET: z.string().optional().default('dev_unsubscribe_secret_replace_in_prod'),

    // HIGH-01 (Audit-2): HMAC secret for shipping webhook signature verification
    SHIPPING_WEBHOOK_SECRET: z.string().optional().default(''),

    // MED-09 (Audit-2): token to protect the detailed /health endpoint from public access
    HEALTH_TOKEN: z.string().optional().default(''),

    // SEC-013: AES-256-GCM key for encrypting TOTP secrets at rest (64 hex chars = 32 bytes)
    APP_ENCRYPTION_KEY: z
      .string()
      .length(64)
      .regex(/^[0-9a-fA-F]{64}$/, 'Must be 64 hex characters'),
  })
  .superRefine((data, ctx) => {
    // SEC-005: reject placeholder webhook secret
    if (data.STRIPE_WEBHOOK_SECRET === 'whsec_placeholder_replace_me') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STRIPE_WEBHOOK_SECRET'],
        message:
          'STRIPE_WEBHOOK_SECRET is still the placeholder value. Replace it with the real Stripe signing secret (Stripe Dashboard → Webhooks → Signing secret).',
      });
    }

    // SEC-010: block test keys in production
    if (data.NODE_ENV === 'production') {
      if (data.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STRIPE_SECRET_KEY'],
          message:
            'STRIPE_SECRET_KEY must be a live key (sk_live_*) in production. Test keys cannot process real payments.',
        });
      }

      // MED-10 (Audit-2): localhost CORS in production would accept cross-origin requests from dev
      if (data.CORS_ORIGIN.includes('localhost')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message:
            'CORS_ORIGIN cannot contain "localhost" in production. Set the real HTTPS domain in Doppler.',
        });
      }

      // LOW-07 (Audit-2): JWT_ACCESS_SECRET is deprecated — warn if still set to non-empty value
      // (it means code may still be using it for signing, which is now handled by RS256 keys)
      if (data.JWT_ACCESS_SECRET !== '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message:
            'JWT_ACCESS_SECRET is deprecated (replaced by RS256 key pair). Remove it from Doppler to avoid accidental usage.',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${errors}`);
  }
  return parsed.data;
}
