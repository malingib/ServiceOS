import { HeartbeatService } from '../services/heartbeat.service';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    workerProfile: { updateMany: jest.fn() },
  },
}));

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

jest.mock('@mobiwave/shared', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('HeartbeatService', () => {
  let heartbeatService: HeartbeatService;

  beforeEach(() => {
    heartbeatService = new HeartbeatService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('recordHeartbeat', () => {
    it('should record heartbeat in Redis and update location', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });

      expect(result.recorded).toBe(true);
      expect(result.nextHeartbeat).toBeGreaterThan(Date.now());
      expect(mockedPrisma.workerProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker-1', tenantId: 'tenant-1' },
        }),
      );
    });
  });

  describe('getWorkerStatus', () => {
    it('should return online status for active worker', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });

      const status = await heartbeatService.getWorkerStatus('worker-1');

      expect(status.online).toBe(true);
      expect(status.location).toEqual({ lat: -1.2921, lng: 36.8219 });
    });

    it('should return offline for unknown worker', async () => {
      const status = await heartbeatService.getWorkerStatus('unknown-worker');

      expect(status.online).toBe(false);
    });

    it('should return offline for stale heartbeat', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });

      jest.advanceTimersByTime(121 * 1000);

      const status = await heartbeatService.getWorkerStatus('worker-1');

      expect(status.online).toBe(false);
    });
  });

  describe('getOnlineWorkers', () => {
    it('should return list of online workers', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });
      jest.advanceTimersByTime(1000);
      await heartbeatService.recordHeartbeat('worker-2', 'tenant-1', { lat: -1.2833, lng: 36.8167 });

      const online = await heartbeatService.getOnlineWorkers('tenant-1');

      expect(online).toHaveLength(2);
    });

    it('should exclude workers from different tenant', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });
      await heartbeatService.recordHeartbeat('worker-2', 'tenant-2', { lat: -1.2833, lng: 36.8167 });

      const online = await heartbeatService.getOnlineWorkers('tenant-1');

      expect(online).toHaveLength(1);
      expect(online[0].workerId).toBe('worker-1');
    });
  });

  describe('checkStaleWorkers', () => {
    it('should detect and handle stale workers', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });
      await heartbeatService.recordHeartbeat('worker-2', 'tenant-1', { lat: -1.2833, lng: 36.8167 });

      jest.advanceTimersByTime(121 * 1000);

      const stale = await heartbeatService.checkStaleWorkers();

      expect(stale).toHaveLength(2);
      expect(mockedPrisma.workerProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isAvailable: false }),
        }),
      );
    });

    it('should not report active workers as stale', async () => {
      (mockedPrisma.workerProfile.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await heartbeatService.recordHeartbeat('worker-1', 'tenant-1', { lat: -1.2921, lng: 36.8219 });

      const stale = await heartbeatService.checkStaleWorkers();

      expect(stale).toHaveLength(0);
    });
  });
});
