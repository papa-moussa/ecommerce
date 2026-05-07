import { CacheInterceptor, CACHE_KEY_METADATA } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected override isRequestCacheable(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();

    // Only cache GET requests
    const isGetRequest = request.method === 'GET';
    if (!isGetRequest) return false;

    // Do NOT cache admin routes
    const url = request.url;
    if (url.includes('/admin')) return false;

    // Do NOT cache health checks
    if (url.includes('/health')) return false;

    // Do NOT cache auth/me or sensitive user data
    if (url.includes('/auth/me')) return false;

    return true;
  }

  // Override to include query params in the cache key
  override trackBy(context: ExecutionContext): string | undefined {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { url, method } = request;

    // Check if a manual cache key was provided via decorator
    const cacheKey = this.reflector.get(CACHE_KEY_METADATA, context.getHandler());
    if (cacheKey) return cacheKey;

    if (method !== 'GET') return undefined;

    // The key is the full URL including query params
    return url;
  }
}
