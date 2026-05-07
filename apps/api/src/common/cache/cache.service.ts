import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redisClient?: Redis;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Get the underlying redis client if possible
    const store = (this.cacheManager as any).store;
    if (store && store.client) {
      this.redisClient = store.client;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Invalidate all keys matching a pattern (e.g. "product:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available for pattern invalidation');
      return;
    }

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate pattern: ${pattern}`, error);
    }
  }

  async clear(): Promise<void> {
    await (this.cacheManager as any).reset();
  }
}
