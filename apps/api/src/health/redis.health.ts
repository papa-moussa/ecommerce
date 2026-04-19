import { createConnection } from 'node:net';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

import type { AppConfig } from '../config/configuration';

/**
 * Lightweight Redis TCP ping.
 * Avoids pulling ioredis in Sprint 0 — full client module arrives in Sprint 7 (cache).
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService<AppConfig, true>) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const url = new URL(this.config.get('REDIS_URL', { infer: true }));
    const host = url.hostname;
    const port = Number(url.port || 6379);

    try {
      await new Promise<void>((resolve, reject) => {
        const socket = createConnection({ host, port, timeout: 2000 });
        socket.once('connect', () => {
          socket.end();
          resolve();
        });
        socket.once('error', reject);
        socket.once('timeout', () => {
          socket.destroy();
          reject(new Error('Redis connection timeout'));
        });
      });
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: err instanceof Error ? err.message : 'unknown error',
        }),
      );
    }
  }
}
