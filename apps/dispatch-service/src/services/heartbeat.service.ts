import prisma from '@mobiwave/prisma';
import Redis from 'ioredis';
import { logger } from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const HEARTBEAT_KEY_PREFIX = 'worker:heartbeat:';
const HEARTBEAT_TTL = 120;
const HEARTBEAT_CHECK_INTERVAL = 30;

export class HeartbeatService {
  async recordHeartbeat(workerId: string, tenantId: string, location: { lat: number; lng: number }) {
    const key = `${HEARTBEAT_KEY_PREFIX}${workerId}`;
    const data = JSON.stringify({
      workerId,
      tenantId,
      location,
      timestamp: Date.now(),
    });
    await redis.setex(key, HEARTBEAT_TTL, data);

    await prisma.workerProfile.updateMany({
      where: { userId: workerId, tenantId },
      data: { currentLocation: JSON.parse(JSON.stringify(location)) },
    });

    return { recorded: true, nextHeartbeat: Date.now() + HEARTBEAT_TTL * 1000 };
  }

  async getWorkerStatus(workerId: string) {
    const key = `${HEARTBEAT_KEY_PREFIX}${workerId}`;
    const data = await redis.get(key);
    if (!data) return { online: false };

    const parsed = JSON.parse(data);
    const isOnline = Date.now() - parsed.timestamp < HEARTBEAT_TTL * 1000;

    return {
      online: isOnline,
      location: parsed.location,
      lastSeen: new Date(parsed.timestamp),
    };
  }

  async getOnlineWorkers(tenantId: string) {
    const keys = await redis.keys(`${HEARTBEAT_KEY_PREFIX}*`);
    const onlineWorkers: Array<{ workerId: string; location: { lat: number; lng: number }; lastSeen: Date }> = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.tenantId === tenantId && Date.now() - parsed.timestamp < HEARTBEAT_TTL * 1000) {
          onlineWorkers.push({
            workerId: parsed.workerId,
            location: parsed.location,
            lastSeen: new Date(parsed.timestamp),
          });
        }
      }
    }

    return onlineWorkers;
  }

  async checkStaleWorkers(): Promise<Array<{ workerId: string; tenantId: string }>> {
    const keys = await redis.keys(`${HEARTBEAT_KEY_PREFIX}*`);
    const staleWorkers: Array<{ workerId: string; tenantId: string }> = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Date.now() - parsed.timestamp > HEARTBEAT_TTL * 1000) {
          staleWorkers.push({ workerId: parsed.workerId, tenantId: parsed.tenantId });
          await redis.del(key);

          await prisma.workerProfile.updateMany({
            where: { userId: parsed.workerId, tenantId: parsed.tenantId },
            data: { isAvailable: false },
          });
        }
      }
    }

    if (staleWorkers.length > 0) {
      logger.warn({ count: staleWorkers.length }, 'Stale workers detected and marked unavailable');
    }

    return staleWorkers;
  }
}

export const heartbeatService = new HeartbeatService();
