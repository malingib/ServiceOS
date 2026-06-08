import { WorkerService } from '../services/worker.service';
import { createMockWorkerProfile, createMockTenant, createMockUser } from '@mobiwave/testing';
import { NotFoundError } from '@mobiwave/shared';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    workerProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('WorkerService', () => {
  const workerService = new WorkerService();
  const mockTenant = createMockTenant();
  const mockUser = createMockUser({ tenantId: mockTenant.id, role: 'WORKER' });
  const mockProfile = createMockWorkerProfile({ userId: mockUser.id, tenantId: mockTenant.id });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a worker profile', async () => {
      (mockedPrisma.workerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.workerProfile.create as jest.Mock).mockResolvedValue(mockProfile);

      const result = await workerService.create({
        userId: mockUser.id,
        tenantId: mockTenant.id,
        skills: ['cleaning', 'laundry'],
        hourlyRate: 500,
      });

      expect(result.isAvailable).toBe(true);
      expect(result.kycStatus).toBe('PENDING');
    });

    it('should return existing profile if already exists', async () => {
      (mockedPrisma.workerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await workerService.create({
        userId: mockUser.id,
        tenantId: mockTenant.id,
      });

      expect(result).toBe(mockProfile);
      expect(mockedPrisma.workerProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return worker profile', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);

      const result = await workerService.getById(mockUser.id, mockTenant.id);

      expect(result.id).toBe(mockProfile.id);
    });

    it('should throw NotFoundError for non-existent profile', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(workerService.getById('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update worker profile', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockedPrisma.workerProfile.update as jest.Mock).mockResolvedValue({
        ...mockProfile,
        isAvailable: false,
      });

      const result = await workerService.update(mockUser.id, mockTenant.id, {
        isAvailable: false,
      });

      expect(result.isAvailable).toBe(false);
    });

    it('should throw NotFoundError for non-existent profile', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(workerService.update('non-existent', mockTenant.id, {}))
        .rejects.toThrow(NotFoundError);
    });

    it('should update current location', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockedPrisma.workerProfile.update as jest.Mock).mockResolvedValue(mockProfile);

      await workerService.update(mockUser.id, mockTenant.id, {
        currentLocation: { lat: -1.2921, lng: 36.8219 },
      });

      const updateCall = (mockedPrisma.workerProfile.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.currentLocation).toBeDefined();
    });
  });

  describe('submitKyc', () => {
    it('should submit KYC documents for review', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockedPrisma.workerProfile.update as jest.Mock).mockResolvedValue({
        ...mockProfile,
        kycStatus: 'IN_REVIEW',
        idNumber: '12345678',
      });

      const result = await workerService.submitKyc(mockUser.id, mockTenant.id, {
        idNumber: '12345678',
        documentUrls: ['https://example.com/doc1.pdf'],
      });

      expect(result.kycStatus).toBe('IN_REVIEW');
    });

    it('should throw NotFoundError for non-existent worker', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(workerService.submitKyc('non-existent', mockTenant.id, {
        idNumber: '12345678',
        documentUrls: [],
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('should return paginated workers', async () => {
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([mockProfile]);
      (mockedPrisma.workerProfile.count as jest.Mock).mockResolvedValue(1);

      const result = await workerService.list(mockTenant.id);

      expect(result.workers).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter available workers', async () => {
      (mockedPrisma.workerProfile.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.workerProfile.count as jest.Mock).mockResolvedValue(0);

      await workerService.list(mockTenant.id, 1, 20, true);

      const where = (mockedPrisma.workerProfile.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.isAvailable).toBe(true);
    });
  });

  describe('updateLocation', () => {
    it('should update worker location', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockedPrisma.workerProfile.update as jest.Mock).mockResolvedValue({
        ...mockProfile,
        currentLocation: { lat: -1.2921, lng: 36.8219 },
      });

      const result = await workerService.updateLocation(mockUser.id, mockTenant.id, {
        lat: -1.2921,
        lng: 36.8219,
      });

      expect(result.currentLocation).toEqual({ lat: -1.2921, lng: 36.8219 });
    });

    it('should throw NotFoundError for non-existent worker', async () => {
      (mockedPrisma.workerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(workerService.updateLocation('non-existent', mockTenant.id, {
        lat: -1.2921,
        lng: 36.8219,
      })).rejects.toThrow(NotFoundError);
    });
  });
});
