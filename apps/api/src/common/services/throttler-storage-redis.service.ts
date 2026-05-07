import Redis from 'ioredis';

// ThrottlerStorageRecord is not re-exported by @nestjs/throttler v6 public API
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis-backed ThrottlerStorage using ioredis.
 * Instantiated directly in ThrottlerModule.forRootAsync (not via NestJS DI),
 * so the client is initialized eagerly in the constructor.
 * Rate limit counters survive API restarts and are shared across instances.
 */
export class ThrottlerStorageRedisService {
  private readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      lazyConnect: false,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const blockKey = `${key}:block`;

    // If blocked, return early without counting
    const blockPttl = await this.client.pttl(blockKey);
    if (blockPttl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockPttl,
      };
    }

    // Atomically increment + fetch new TTL
    const [incrResult, pttlResult] =
      (await this.client.pipeline().incr(key).pttl(key).exec()) ?? [];

    const totalHits = (incrResult?.[1] as number | null) ?? 1;
    let timeToExpire = (pttlResult?.[1] as number | null) ?? -1;

    // Set TTL on first hit (key had no expiry yet)
    if (timeToExpire < 0) {
      await this.client.pexpire(key, ttl);
      timeToExpire = ttl;
    }

    // Trigger block if limit exceeded
    if (totalHits > limit && blockDuration > 0) {
      await this.client.psetex(blockKey, blockDuration, '1');
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }
}
