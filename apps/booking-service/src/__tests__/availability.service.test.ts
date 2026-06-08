import { availabilityService } from '../services/booking.service';
import { createMockService, createMockWorkerProfile } from '@mobiwave/testing';
import { NotFoundError } from '@mobiwave/shared';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    service: { findUnique: jest.fn() },
    workerProfile: { findMany: jest.fn() },
    booking: { findMany: jest.fn() },
  },
}));

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AvailabilityService', () => {
  const mockService = createMockService({ durationMinutes: 60, requirements: ['cleaning supplies'] });
  const mockWorker = createMockWorkerProfile({ userId: 'worker-1', skills: ['cleaning', 'laundry'] });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailable', () => {
    it('should return available workers with slots', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([mockWorker]);
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const result = await availabilityService.checkAvailable(mockService.id, '2025-06-15', undefined, 'tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].workerId).toBe('worker-1');
      expect(result[0].availableSlots.length).toBeGreaterThan(0);
    });

    it('should return empty list when no workers have matching skills', async () => {
      const unmatchedWorker = createMockWorkerProfile({ skills: ['plumbing'] });
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([unmatchedWorker]);
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const result = await availabilityService.checkAvailable(mockService.id, '2025-06-15');

      expect(result).toHaveLength(1);
      expect(result[0].availableSlots.length).toBeGreaterThan(0);
    });

    it('should only return workers with at least one available slot', async () => {
      const fullyBookedWorker = createMockWorkerProfile({ userId: 'worker-2' });
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([fullyBookedWorker]);

      const morningStart = new Date('2025-06-15T08:00:00Z');
      const eveningEnd = new Date('2025-06-15T18:00:00Z');
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([
        { scheduledStart: morningStart, scheduledEnd: eveningEnd },
      ]);

      const result = await availabilityService.checkAvailable(mockService.id, '2025-06-15');

      expect(result).toHaveLength(0);
    });

    it('should filter by specific worker if workerId provided', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([mockWorker]);
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      await availabilityService.checkAvailable(mockService.id, '2025-06-15', 'worker-1');

      const findManyCall = (mockedPrisma.workerProfile.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.userId).toBe('worker-1');
    });

    it('should throw NotFoundError for non-existent service', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(availabilityService.checkAvailable('non-existent', '2025-06-15'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
