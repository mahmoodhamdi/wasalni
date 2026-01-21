import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Cache middleware options
 */
interface CacheOptions {
  /** Cache TTL in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Key prefix for cache (default: 'api:cache:') */
  prefix?: string;
  /** Function to generate cache key (default: uses URL + query params) */
  keyGenerator?: (req: Request) => string;
  /** Skip cache for authenticated requests (default: false) */
  skipAuth?: boolean;
}

/**
 * Default cache key generator
 */
const defaultKeyGenerator = (req: Request): string => {
  const queryString = Object.keys(req.query).length
    ? `?${new URLSearchParams(req.query as Record<string, string>).toString()}`
    : '';
  return `${req.method}:${req.originalUrl}${queryString}`;
};

/**
 * Create a caching middleware for API responses
 *
 * @example
 * // Cache for 5 minutes (default)
 * router.get('/settings', cache(), getSettings);
 *
 * @example
 * // Cache for 1 hour
 * router.get('/fare/settings', cache({ ttl: 3600 }), getFareSettings);
 *
 * @example
 * // Custom key generator
 * router.get('/user/:id', cache({
 *   keyGenerator: (req) => `user:${req.params.id}`
 * }), getUser);
 */
export const cache = (options: CacheOptions = {}) => {
  const {
    ttl = 300,
    prefix = 'api:cache:',
    keyGenerator = defaultKeyGenerator,
    skipAuth = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Skip if authenticated and skipAuth is true
    if (skipAuth && req.user) {
      next();
      return;
    }

    const redis = getRedisClient();

    // Skip if Redis not available
    if (!redis) {
      next();
      return;
    }

    const cacheKey = `${prefix}${keyGenerator(req)}`;

    try {
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        const data = JSON.parse(cachedData);
        res.setHeader('X-Cache', 'HIT');
        res.json(data);
        return;
      }

      // Cache miss - intercept response
      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = ((body: unknown) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
            logger.error(`Cache set error: ${err}`);
          });
        }
        return originalJson(body);
      }) as typeof res.json;

      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error}`);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 *
 * @example
 * // Invalidate all fare settings cache
 * await invalidateCache('api:cache:*fare*');
 */
export const invalidateCache = async (pattern: string): Promise<number> => {
  const redis = getRedisClient();

  if (!redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
    return keys.length;
  } catch (error) {
    logger.error(`Cache invalidation error: ${error}`);
    return 0;
  }
};

/**
 * Clear all API cache
 */
export const clearAllCache = async (): Promise<number> => {
  return invalidateCache('api:cache:*');
};

export default { cache, invalidateCache, clearAllCache };
