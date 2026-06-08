import Redis, { RedisOptions } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

let clientInstance: Redis | null = null;

function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

function getRedisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 5) return null;
      return Math.min(times * 100, 3000);
    },
    enableReadyCheck: true,
    lazyConnect: false,
  };
}

export function getRedis(): Redis {
  if (!clientInstance) {
    clientInstance = new Redis(getRedisUrl(), getRedisOptions());
    clientInstance.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });
  }
  return clientInstance;
}

export async function disconnectRedis(): Promise<void> {
  if (clientInstance) {
    await clientInstance.quit();
    clientInstance = null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  const serialized = JSON.stringify(value);
  await redis.setex(key, ttlSeconds, serialized);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function delCache(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const redis = getRedis();
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const pipeline = redis.pipeline();
  stream.on('data', (keys: string[]) => {
    for (const key of keys) {
      pipeline.del(key);
    }
  });
  await new Promise<void>((resolve, reject) => {
    stream.on('end', () => {
      pipeline.exec().catch(() => {});
      resolve();
    });
    stream.on('error', reject);
  });
}

export class RateLimiter {
  private keyPrefix: string;

  constructor(keyPrefix = 'rl') {
    this.keyPrefix = keyPrefix;
  }

  async check(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const redis = getRedis();
    const redisKey = `${this.keyPrefix}:${key}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const multi = redis.multi();
    multi.zremrangebyscore(redisKey, 0, windowStart);
    multi.zadd(redisKey, now.toString(), `${now}:${Math.random()}`);
    multi.zcard(redisKey);
    multi.expire(redisKey, windowSeconds);

    const results = await multi.exec();
    const requestCount = (results?.[2]?.[1] as number) || 0;
    const resetAt = Math.ceil((now + windowSeconds * 1000) / 1000);

    return {
      allowed: requestCount <= maxRequests,
      remaining: Math.max(0, maxRequests - requestCount),
      resetAt,
    };
  }

  async increment(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const result = await this.check(key, maxRequests, windowSeconds);
    return result.allowed;
  }
}

export class DistributedLock {
  private keyPrefix: string;

  constructor(keyPrefix = 'lock') {
    this.keyPrefix = keyPrefix;
  }

  async acquire(lockKey: string, ttlSeconds = 30, retryDelayMs = 100, maxRetries = 5): Promise<string | null> {
    const redis = getRedis();
    const redisKey = `${this.keyPrefix}:${lockKey}`;
    const lockValue = uuidv4();

    for (let i = 0; i < maxRetries; i++) {
      const acquired = await redis.set(redisKey, lockValue, 'EX', ttlSeconds, 'NX');
      if (acquired === 'OK') return lockValue;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
    return null;
  }

  async release(lockKey: string, lockValue: string): Promise<boolean> {
    const redis = getRedis();
    const redisKey = `${this.keyPrefix}:${lockKey}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await redis.eval(script, 1, redisKey, lockValue);
    return result === 1;
  }

  async execute<T>(lockKey: string, fn: () => Promise<T>, ttlSeconds = 30): Promise<T> {
    const lockValue = await this.acquire(lockKey, ttlSeconds);
    if (!lockValue) {
      throw new Error(`Failed to acquire lock: ${lockKey}`);
    }
    try {
      return await fn();
    } finally {
      await this.release(lockKey, lockValue);
    }
  }
}

export class SessionStore {
  private keyPrefix: string;

  constructor(keyPrefix = 'session') {
    this.keyPrefix = keyPrefix;
  }

  private buildKey(sessionId: string): string {
    return `${this.keyPrefix}:${sessionId}`;
  }

  async set(sessionId: string, data: Record<string, unknown>, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    await redis.setex(this.buildKey(sessionId), ttlSeconds, JSON.stringify(data));
  }

  async get<T = Record<string, unknown>>(sessionId: string): Promise<T | null> {
    const redis = getRedis();
    const raw = await redis.get(this.buildKey(sessionId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async del(sessionId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(this.buildKey(sessionId));
  }

  async touch(sessionId: string, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    await redis.expire(this.buildKey(sessionId), ttlSeconds);
  }

  async exists(sessionId: string): Promise<boolean> {
    const redis = getRedis();
    const result = await redis.exists(this.buildKey(sessionId));
    return result === 1;
  }
}

export async function acquireLock(lockKey: string, ttlSeconds = 30): Promise<string | null> {
  const lock = new DistributedLock();
  return lock.acquire(lockKey, ttlSeconds);
}

export async function releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
  const lock = new DistributedLock();
  return lock.release(lockKey, lockValue);
}
