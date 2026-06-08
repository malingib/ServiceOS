type RedisValue = string | number | Buffer | null;
type RedisPipelineResult = [Error | null, unknown];

interface StoredValue {
  value: string;
  expiresAt: number | null;
}

export class RedisMock {
  private store: Map<string, StoredValue> = new Map();
  private pipelineCommands: Array<{ cmd: string; args: unknown[] }> = [];

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiresAt: null });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async exists(...keys: string[]): Promise<number> {
    return keys.filter(k => this.store.has(k)).length;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  multi(): {
    zremrangebyscore(...args: unknown[]): void;
    zadd(...args: unknown[]): void;
    zcard(...args: unknown[]): void;
    expire(...args: unknown[]): void;
    exec(): Promise<RedisPipelineResult[]>;
  } {
    this.pipelineCommands = [];
    const self = this;
    return {
      zremrangebyscore(...args: unknown[]) { self.pipelineCommands.push({ cmd: 'zremrangebyscore', args }); },
      zadd(...args: unknown[]) { self.pipelineCommands.push({ cmd: 'zadd', args }); },
      zcard(...args: unknown[]) { self.pipelineCommands.push({ cmd: 'zcard', args }); },
      expire(...args: unknown[]) { self.pipelineCommands.push({ cmd: 'expire', args }); },
      async exec(): Promise<RedisPipelineResult[]> {
        const results: RedisPipelineResult[] = self.pipelineCommands.map(() => [null, 'OK']);
        self.pipelineCommands = [];
        return results;
      },
    };
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  getStore(): Map<string, StoredValue> {
    return this.store;
  }
}

export const createRedisMock = (): RedisMock => new RedisMock();
