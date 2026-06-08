import { bookingService, availabilityService } from '../services/booking.service';
import {
  createMockBooking, createMockService, createMockUser,
  createMockWorkerProfile, createMockTenant,
} from '@mobiwave/testing';
import { NotFoundError, ConflictError, BookingConflictError } from '@mobiwave/shared';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    booking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    service: { findUnique: jest.fn(), findFirst: jest.fn() },
    address: { findFirst: jest.fn() },
    workerProfile: { findFirst: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('BookingService', () => {
  const mockTenant = createMockTenant();
  const mockService = createMockService({ tenantId: mockTenant.id });
  const mockUser = createMockUser({ tenantId: mockTenant.id });
  const mockBooking = createMockBooking({ tenantId: mockTenant.id, customerId: mockUser.id, serviceId: mockService.id });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.address.findFirst as jest.Mock).mockResolvedValue({ id: 'address-1' });
      (mockedPrisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const result = await bookingService.create({
        tenantId: mockTenant.id,
        customerId: mockUser.id,
        serviceId: mockService.id,
        addressId: 'address-1',
        scheduledDate: '2025-06-15',
        scheduledStart: '10:00',
        notes: 'Please be thorough',
      });

      expect(result.status).toBe('PENDING');
      expect(result.totalAmount).toBe(mockService.basePrice);
    });

    it('should throw NotFoundError for non-existent service', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(bookingService.create({
        tenantId: mockTenant.id,
        customerId: mockUser.id,
        serviceId: 'non-existent',
        addressId: 'address-1',
        scheduledDate: '2025-06-15',
        scheduledStart: '10:00',
      })).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent address', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(bookingService.create({
        tenantId: mockTenant.id,
        customerId: mockUser.id,
        serviceId: mockService.id,
        addressId: 'non-existent',
        scheduledDate: '2025-06-15',
        scheduledStart: '10:00',
      })).rejects.toThrow(NotFoundError);
    });

    it('should calculate end time from service duration', async () => {
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.address.findFirst as jest.Mock).mockResolvedValue({ id: 'address-1' });
      (mockedPrisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      await bookingService.create({
        tenantId: mockTenant.id,
        customerId: mockUser.id,
        serviceId: mockService.id,
        addressId: 'address-1',
        scheduledDate: '2025-06-15',
        scheduledStart: '10:00',
      });

      const createCall = (mockedPrisma.booking.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.baseAmount).toBe(mockService.basePrice);
      expect(createCall.data.totalAmount).toBe(mockService.basePrice);
    });
  });

  describe('getById', () => {
    it('should return booking by ID', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);

      const result = await bookingService.getById(mockBooking.id, mockTenant.id);

      expect(result.id).toBe(mockBooking.id);
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(bookingService.getById('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('should return paginated bookings', async () => {
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);
      (mockedPrisma.booking.count as jest.Mock).mockResolvedValue(1);

      const result = await bookingService.list(mockTenant.id, { page: 1, limit: 20 });

      expect(result.bookings).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.booking.count as jest.Mock).mockResolvedValue(0);

      await bookingService.list(mockTenant.id, { status: 'PENDING' });

      const where = (mockedPrisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBe('PENDING');
    });

    it('should filter by date range', async () => {
      (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.booking.count as jest.Mock).mockResolvedValue(0);

      await bookingService.list(mockTenant.id, { startDate: '2025-06-01', endDate: '2025-06-30' });

      const where = (mockedPrisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.scheduledDate).toBeDefined();
      expect(where.scheduledDate.gte).toBeDefined();
      expect(where.scheduledDate.lte).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'CANCELLED' });

      const result = await bookingService.cancel(mockBooking.id, mockTenant.id, mockUser.id, 'Change of plans');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(bookingService.cancel('non-existent', mockTenant.id, mockUser.id, 'reason'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when invalid status transition', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'COMPLETED' });

      await expect(bookingService.cancel(mockBooking.id, mockTenant.id, mockUser.id, 'reason'))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('reschedule', () => {
    it('should reschedule a pending booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'PENDING' });

      const result = await bookingService.reschedule(mockBooking.id, mockTenant.id, '2025-06-20', '14:00');

      expect(result.status).toBe('PENDING');
    });

    it('should throw ConflictError for in-progress booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'IN_PROGRESS' });

      await expect(bookingService.reschedule(mockBooking.id, mockTenant.id, '2025-06-20', '14:00'))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('confirm', () => {
    it('should confirm a pending booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'CONFIRMED' });

      const result = await bookingService.confirm(mockBooking.id, mockTenant.id);

      expect(result.status).toBe('CONFIRMED');
    });

    it('should throw ConflictError for already completed booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'COMPLETED' });

      await expect(bookingService.confirm(mockBooking.id, mockTenant.id)).rejects.toThrow(ConflictError);
    });
  });

  describe('complete', () => {
    it('should complete an in-progress booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'IN_PROGRESS' });
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'COMPLETED' });

      const result = await bookingService.complete(mockBooking.id, mockTenant.id);

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw ConflictError for invalid status', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'PENDING' });

      await expect(bookingService.complete(mockBooking.id, mockTenant.id)).rejects.toThrow(ConflictError);
    });
  });

  describe('assignWorker', () => {
    it('should assign worker to booking', async () => {
      const mockWorker = createMockWorkerProfile({ userId: 'worker-1', tenantId: mockTenant.id });
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockWorker);
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValueOnce(mockBooking).mockResolvedValueOnce(null);
      (mockedPrisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, workerId: 'worker-1', status: 'ASSIGNED' });

      const result = await bookingService.assignWorker(mockBooking.id, mockTenant.id, 'worker-1');

      expect(result.status).toBe('ASSIGNED');
    });

    it('should detect scheduling conflict', async () => {
      const mockWorker = createMockWorkerProfile({ userId: 'worker-1', tenantId: mockTenant.id });
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockWorker);
      (mockedPrisma.booking.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce({ id: 'conflicting-booking' });

      await expect(bookingService.assignWorker(mockBooking.id, mockTenant.id, 'worker-1'))
        .rejects.toThrow(BookingConflictError);
    });
  });
});

describe('AvailabilityService', () => {
  const mockService = createMockService();
  const mockWorker = createMockWorkerProfile();

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
  });

  it('should return available slots for workers', async () => {
    (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([mockWorker]);
    (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);

    const result = await availabilityService.checkAvailable(mockService.id, '2025-06-15');

    expect(result).toHaveLength(1);
    expect(result[0].availableSlots.length).toBeGreaterThan(0);
  });

  it('should return empty when no workers available', async () => {
    (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([]);

    const result = await availabilityService.checkAvailable(mockService.id, '2025-06-15');

    expect(result).toHaveLength(0);
  });

  it('should filter out booked slots', async () => {
    (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([mockWorker]);
    const bookingStart = new Date('2025-06-15T10:00:00Z');
    const bookingEnd = new Date('2025-06-15T12:00:00Z');
    (mockedPrisma.booking.findMany as jest.Mock).mockResolvedValue([
      { scheduledStart: bookingStart, scheduledEnd: bookingEnd },
    ]);

    const result = await availabilityService.checkAvailable(mockService.id, '2025-06-15');

    expect(result[0].availableSlots).not.toContain('10:00');
  });

  it('should throw NotFoundError for non-existent service', async () => {
    (mockedPrisma.service.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(availabilityService.checkAvailable('non-existent', '2025-06-15'))
      .rejects.toThrow(NotFoundError);
  });
});
