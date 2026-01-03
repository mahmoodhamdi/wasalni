import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis | null> => {
  // Skip Redis in development if not configured
  if (config.nodeEnv === 'development' && !config.redisUrl) {
    logger.warn('Redis URL not configured, skipping Redis connection');
    return null;
  }

  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err}`);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Test the connection
    await redisClient.ping();

    return redisClient;
  } catch (error) {
    logger.warn(`Redis connection failed: ${error}. Continuing without Redis.`);
    if (redisClient) {
      redisClient.disconnect();
      redisClient = null;
    }
    return null;
  }
};

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};

export default { connectRedis, getRedisClient, disconnectRedis };
