import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { RateLimitError } from '../utils/errors';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  skipSuccessfulRequests?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'rl',
};

export function rateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const cfg = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${cfg.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - cfg.windowMs;

    try {
      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now.toString(), `${now}:${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, Math.ceil(cfg.windowMs / 1000));

      const results = await multi.exec();
      const requestCount = results?.[2]?.[1] as number;

      res.setHeader('X-RateLimit-Limit', cfg.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, cfg.maxRequests - requestCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + cfg.windowMs) / 1000));

      if (requestCount > cfg.maxRequests) {
        throw new RateLimitError();
      }

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        next(error);
      } else {
        next();
      }
    }
  };
}

export const globalRateLimit = rateLimitMiddleware({ maxRequests: 100 });
export const authRateLimit = rateLimitMiddleware({ maxRequests: 10, keyPrefix: 'rl:auth' });
export const paymentRateLimit = rateLimitMiddleware({ maxRequests: 5, keyPrefix: 'rl:payment' });
