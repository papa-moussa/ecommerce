import { createPublicKey, type JsonWebKey } from 'crypto';

import { Controller, Get, Header, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Public } from '../common/decorators/public.decorator';
import { type AppConfig } from '../config/configuration';

interface JwkKey extends JsonWebKey {
  kid: string;
  use: string;
  alg: string;
}

/**
 * SEC-022: Expose the RSA public key as a JSON Web Key Set (JWKS).
 *
 * Consumers (e.g. Next.js Edge middleware) can fetch this endpoint to obtain
 * the public key and verify RS256 access tokens without needing the private key.
 *
 * GET /.well-known/jwks.json  — no authentication required
 */
@Public()
@Controller('.well-known')
export class WellKnownController {
  private readonly logger = new Logger(WellKnownController.name);
  private readonly jwks: { keys: JwkKey[] };

  constructor(config: ConfigService<AppConfig, true>) {
    const publicKeyPem = config.get('JWT_PUBLIC_KEY', { infer: true });

    // Export the RSA public key in JWK format using Node.js built-in crypto.
    const cryptoKey = createPublicKey(publicKeyPem);
    const jwk = cryptoKey.export({ format: 'jwk' }) as JsonWebKey;

    this.jwks = {
      keys: [
        {
          ...jwk,
          kid: 'api-rs256-1', // Key ID — increment when rotating keys
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };

    this.logger.log('JWKS endpoint initialised (SEC-022)');
  }

  /**
   * Returns the public key set used to verify JWT access tokens.
   * Cache-friendly: set Cache-Control header to allow CDN/Edge caching.
   */
  // LOW-05 (Audit-2): static key — cache aggressively to reduce unnecessary fetches
  @Get('jwks.json')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  getJwks(): { keys: JwkKey[] } {
    return this.jwks;
  }
}
