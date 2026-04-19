import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseEnv = {
    NODE_ENV: 'test',
    PORT: '3001',
    API_PREFIX: 'api',
    CORS_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  it('parses a valid env', () => {
    const result = validateEnv(baseEnv);
    expect(result.PORT).toBe(3001);
    expect(result.NODE_ENV).toBe('test');
  });

  it('throws when a required var is missing', () => {
    const { DATABASE_URL: _omit, ...rest } = baseEnv;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('throws when JWT secret is too short', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_ACCESS_SECRET: 'short' })).toThrow();
  });
});
