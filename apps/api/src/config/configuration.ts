import type { Env } from './env.validation';

/**
 * Typed accessor returned to Nest ConfigModule.
 * Works with `ConfigService<AppConfig, true>` for strict typing.
 *
 * NOTE: ConfigService reads from this factory, NOT from the Zod `validate`
 * return value.  Any Zod .transform() you define in env.validation.ts must
 * also be replicated here so that ConfigService.get() returns the same
 * processed value that validation produced.
 */
export type AppConfig = Env;

const replacePem = (v: string | undefined): string => (v ?? '').replace(/\\n/g, '\n');

export const configuration = (): AppConfig => {
  const raw = process.env as Record<string, string | undefined>;
  return {
    ...raw,
    // Zod transforms literal \n → real newlines for PEM keys.
    // Replicate the same transform here so all ConfigService consumers
    // (JwtModule, WellKnownController, etc.) receive a properly-formatted PEM.
    JWT_PRIVATE_KEY: replacePem(raw['JWT_PRIVATE_KEY']),
    JWT_PUBLIC_KEY: replacePem(raw['JWT_PUBLIC_KEY']),
  } as AppConfig;
};
