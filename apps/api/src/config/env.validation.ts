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

    JWT_ACCESS_SECRET: z.string().min(32),
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
