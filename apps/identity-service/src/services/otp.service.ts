import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 300;
const OTP_KEY_PREFIX = 'otp:';
const OTP_MAX_ATTEMPTS = 5;

export class OtpService {
  async generate(phone: string): Promise<{ code: string; expiresIn: number }> {
    const code = Array.from({ length: OTP_LENGTH }, () =>
      Math.floor(Math.random() * 10).toString(),
    ).join('');

    const key = `${OTP_KEY_PREFIX}${phone}`;
    await redis.setex(key, OTP_TTL_SECONDS, JSON.stringify({
      code,
      attempts: 0,
      createdAt: Date.now(),
    }));

    return { code, expiresIn: OTP_TTL_SECONDS };
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const key = `${OTP_KEY_PREFIX}${phone}`;
    const raw = await redis.get(key);

    if (!raw) {
      return false;
    }

    const stored = JSON.parse(raw);

    if (stored.attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(key);
      return false;
    }

    if (stored.code !== code) {
      stored.attempts += 1;
      await redis.setex(key, OTP_TTL_SECONDS, JSON.stringify(stored));
      return false;
    }

    await redis.del(key);
    return true;
  }

  async exists(phone: string): Promise<boolean> {
    const key = `${OTP_KEY_PREFIX}${phone}`;
    const raw = await redis.get(key);
    return raw !== null;
  }

  async invalidate(phone: string): Promise<void> {
    const key = `${OTP_KEY_PREFIX}${phone}`;
    await redis.del(key);
  }
}

export const otpService = new OtpService();
