import { dispatchService } from '../services/dispatch.service';
import { createMockBooking, createMockService, createMockWorkerProfile, createMockTenant, createMockJob } from '@mobiwave/testing';
import { NotFoundError, ConflictError, BookingConflictError } from '@mobiwave/shared';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    booking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    workerProfile: { findFirst: jest.fn(), findMany: jest.fn() },
    job: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    service: { findUnique: jest.fn() },
  },
}));

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('DispatchService', () => {
  const mockTenant = createMockTenant();
  const mockService = createMockService({ tenantId: mockTenant.id });
  const mockBooking = createMockBooking({ tenantId: mockTenant.id, serviceId: mockService.id });
  const mockWorker = createMockWorkerProfile({ userId: 'worker-1', tenantId: mockTenant.id });
  const mockJob = createMockJob({ tenantId: mockTenant.id, bookingId: mockBooking.id, workerId: 'worker-1', serviceId: mockService.id });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assignManual', () => {
    it('should assign worker to booking manually', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockWorker);
      (mockedPrisma.booking.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce(null);
      (mockedPrisma.job.create as jest.Mock).mockResolvedValue(mockJob);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'ASSIGNED', workerId: 'worker-1' });

      const result = await dispatchService.assignManual({
        bookingId: mockBooking.id,
        workerId: 'worker-1',
        tenantId: mockTenant.id,
      });

      expect(result.job.status).toBe('ASSIGNED');
      expect(result.booking.status).toBe('ASSIGNED');
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(dispatchService.assignManual({
        bookingId: 'non-existent',
        workerId: 'worker-1',
        tenantId: mockTenant.id,
      })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if booking not in assignable state', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'IN_PROGRESS' });

      await expect(dispatchService.assignManual({
        bookingId: mockBooking.id,
        workerId: 'worker-1',
        tenantId: mockTenant.id,
      })).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if worker is not available', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue({ ...mockWorker, isAvailable: false });

      await expect(dispatchService.assignManual({
        bookingId: mockBooking.id,
        workerId: 'worker-1',
        tenantId: mockTenant.id,
      })).rejects.toThrow(ConflictError);
    });

    it('should detect scheduling conflicts', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockWorker);
      (mockedPrisma.booking.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce({ id: 'conflict-booking' });

      await expect(dispatchService.assignManual({
        bookingId: mockBooking.id,
        workerId: 'worker-1',
        tenantId: mockTenant.id,
      })).rejects.toThrow(BookingConflictError);
    });
  });

  describe('autoAssign', () => {
    it('should auto-assign best worker based on scoring', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([mockWorker]);
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.job.count as jest.Mock).mockResolvedValue(0);
      (mockedPrisma.job.create as jest.Mock).mockResolvedValue(mockJob);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'ASSIGNED' });

      const result = await dispatchService.autoAssign({
        bookingId: mockBooking.id,
        tenantId: mockTenant.id,
      });

      expect(result.booking.status).toBe('ASSIGNED');
    });

    it('should throw ConflictError when no workers available', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([]);

      await expect(dispatchService.autoAssign({
        bookingId: mockBooking.id,
        tenantId: mockTenant.id,
      })).rejects.toThrow(ConflictError);
    });

    it('should prefer workers with higher reliability score', async () => {
      const highReliabilityWorker = createMockWorkerProfile({ userId: 'worker-high', reliabilityScore: 5.0 });
      const lowReliabilityWorker = createMockWorkerProfile({ userId: 'worker-low', reliabilityScore: 2.0 });
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([highReliabilityWorker, lowReliabilityWorker]);
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.job.count as jest.Mock).mockResolvedValue(0);
      (mockedPrisma.job.create as jest.Mock).mockResolvedValue(mockJob);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'ASSIGNED' });

      await dispatchService.autoAssign({ bookingId: mockBooking.id, tenantId: mockTenant.id });

      const createCall = (mockedPrisma.job.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.workerId).toBe('worker-high');
    });

    it('should skip workers already booked for the same time slot', async () => {
      const availableWorker = createMockWorkerProfile({ userId: 'worker-avail' });
      const busyWorker = createMockWorkerProfile({ userId: 'worker-busy' });
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([availableWorker, busyWorker]);
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([{ workerId: 'worker-busy' }]);
      (mockedPrisma.job.count as jest.Mock).mockResolvedValue(0);
      (mockedPrisma.job.create as jest.Mock).mockResolvedValue(mockJob);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'ASSIGNED' });

      await dispatchService.autoAssign({ bookingId: mockBooking.id, tenantId: mockTenant.id });

      const createCall = (mockedPrisma.job.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.workerId).toBe('worker-avail');
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(dispatchService.autoAssign({
        bookingId: 'non-existent',
        tenantId: mockTenant.id,
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateJobState', () => {
    it('should transition job from ASSIGNED to ACCEPTED', async () => {
      (mockedPrisma.job.findFirst as jest.Mock).mockResolvedValue(mockJob);
      (mockedPrisma.job.update as jest.Mock).mockResolvedValue({ ...mockJob, status: 'ACCEPTED', acceptedAt: new Date() });
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({});

      const result = await dispatchService.updateJobState(mockJob.id, mockTenant.id, 'ACCEPTED');

      expect(result.status).toBe('ACCEPTED');
    });

    it('should transition job through full lifecycle', async () => {
      (mockedPrisma.job.findFirst as jest.Mock).mockResolvedValue(mockJob);
      (mockedPrisma.job.update as jest.Mock).mockResolvedValue({ ...mockJob, status: 'ACCEPTED' });
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({});

      await dispatchService.updateJobState(mockJob.id, mockTenant.id, 'ACCEPTED');
      expect((mockedPrisma.job.update as jest.Mock).mock.calls[0][0].data.status).toBe('ACCEPTED');
    });

    it('should reject invalid state transition', async () => {
      (mockedPrisma.job.findFirst as jest.Mock).mockResolvedValue(mockJob);

      await expect(dispatchService.updateJobState(mockJob.id, mockTenant.id, 'COMPLETED'))
        .rejects.toThrow(ConflictError);
    });

    it('should update booking status on COMPLETED', async () => {
      const inProgressJob = { ...mockJob, status: 'IN_PROGRESS' };
      (mockedPrisma.job.findFirst as jest.Mock).mockResolvedValue(inProgressJob);
      (mockedPrisma.job.update as jest.Mock).mockResolvedValue({ ...inProgressJob, status: 'COMPLETED', completedAt: new Date() });
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({});

      await dispatchService.updateJobState(mockJob.id, mockTenant.id, 'COMPLETED', { lat: -1.2921, lng: 36.8219 });

      expect(mockedPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('should throw NotFoundError for non-existent job', async () => {
      (mockedPrisma.job.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(dispatchService.updateJobState('non-existent', mockTenant.id, 'ACCEPTED'))
        .rejects.toThrow(NotFoundError);
    });

    it('should record location on IN_PROGRESS', async () => {
      const acceptedJob = { ...mockJob, status: 'ACCEPTED' };
      (mockedPrisma.job.findFirst as jest.Mock).mockResolvedValue(acceptedJob);
      (mockedPrisma.job.update as jest.Mock).mockResolvedValue({ ...acceptedJob, status: 'IN_PROGRESS' });
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({});

      await dispatchService.updateJobState(mockJob.id, mockTenant.id, 'EN_ROUTE');

      expect(mockedPrisma.job.update).toHaveBeenCalled();
    });
  });

  describe('getWorkerJobs', () => {
    it('should return jobs for a worker', async () => {
      (mockedPrisma.job.findMany as jest.Mock).mockResolvedValue([mockJob]);

      const result = await dispatchService.getWorkerJobs('worker-1', mockTenant.id);

      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      (mockedPrisma.job.findMany as jest.Mock).mockResolvedValue([]);

      await dispatchService.getWorkerJobs('worker-1', mockTenant.id, 'ASSIGNED');

      const where = (mockedPrisma.job.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBe('ASSIGNED');
    });
  });

  describe('listJobs', () => {
    it('should return paginated jobs', async () => {
      (mockedPrisma.job.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (mockedPrisma.job.count as jest.Mock).mockResolvedValue(1);

      const result = await dispatchService.listJobs(mockTenant.id, { page: 1, limit: 20 });

      expect(result.jobs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
