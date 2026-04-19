import type { Env } from './env.validation';

/**
 * Typed accessor returned to Nest ConfigModule.
 * Works with `ConfigService<AppConfig, true>` for strict typing.
 */
export type AppConfig = Env;

export const configuration = (): AppConfig => process.env as unknown as AppConfig;
