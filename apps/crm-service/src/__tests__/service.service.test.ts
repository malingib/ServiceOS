import { ServiceService } from '../services/service.service';
import { createMockService, createMockTenant } from '@mobiwave/testing';
import { NotFoundError, ConflictError } from '@mobiwave/shared';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    service: {
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

describe('ServiceService', () => {
  const serviceService = new ServiceService();
  const mockTenant = createMockTenant();
  const mockService = createMockService({ tenantId: mockTenant.id });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a service', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.service.create as jest.Mock).mockResolvedValue(mockService);

      const result = await serviceService.create({
        tenantId: mockTenant.id,
        name: 'Standard Cleaning',
        category: 'CLEANING',
        basePrice: 2500,
        durationMinutes: 120,
      });

      expect(result.name).toBe('Standard Cleaning');
      expect(result.isActive).toBe(true);
    });

    it('should generate slug from name if not provided', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.service.create as jest.Mock).mockResolvedValue(mockService);

      await serviceService.create({
        tenantId: mockTenant.id,
        name: 'Premium Cleaning',
        category: 'CLEANING',
        basePrice: 5000,
        durationMinutes: 180,
      });

      const createCall = (mockedPrisma.service.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.slug).toBe('premium-cleaning');
    });

    it('should throw ConflictError if slug already exists', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(mockService);

      await expect(serviceService.create({
        tenantId: mockTenant.id,
        name: 'Standard Cleaning',
        category: 'CLEANING',
        basePrice: 2500,
        durationMinutes: 120,
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('getById', () => {
    it('should return service by ID', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(mockService);

      const result = await serviceService.getById(mockService.id, mockTenant.id);

      expect(result.id).toBe(mockService.id);
    });

    it('should throw NotFoundError for non-existent service', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(serviceService.getById('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });

    it('should exclude soft-deleted services', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(serviceService.getById(mockService.id, mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBySlug', () => {
    it('should return service by slug', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(mockService);

      const result = await serviceService.getBySlug('standard-cleaning', mockTenant.id);

      expect(result.slug).toBe('standard-cleaning');
    });

    it('should throw NotFoundError for non-existent slug', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(serviceService.getBySlug('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update service', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.service.update as jest.Mock).mockResolvedValue({ ...mockService, basePrice: 3000 });

      const result = await serviceService.update(mockService.id, mockTenant.id, {
        basePrice: 3000,
      });

      expect(result.basePrice).toBe(3000);
    });

    it('should throw NotFoundError for non-existent service', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(serviceService.update('non-existent', mockTenant.id, { name: 'New' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('should return paginated services', async () => {
      (mockedPrisma.service.findMany as jest.Mock).mockResolvedValue([mockService]);
      (mockedPrisma.service.count as jest.Mock).mockResolvedValue(1);

      const result = await serviceService.list(mockTenant.id);

      expect(result.services).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter active services by default', async () => {
      (mockedPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.service.count as jest.Mock).mockResolvedValue(0);

      await serviceService.list(mockTenant.id);

      const where = (mockedPrisma.service.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.isActive).toBe(true);
    });

    it('should include inactive services when activeOnly is false', async () => {
      (mockedPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.service.count as jest.Mock).mockResolvedValue(0);

      await serviceService.list(mockTenant.id, 1, 20, false);

      const where = (mockedPrisma.service.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.isActive).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should soft-delete service', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(mockService);
      (mockedPrisma.service.update as jest.Mock).mockResolvedValue({ ...mockService, deletedAt: new Date(), isActive: false });

      const result = await serviceService.delete(mockService.id, mockTenant.id);

      expect(result.message).toContain('deleted');
      expect(mockedPrisma.service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
        }),
      );
    });

    it('should throw NotFoundError for non-existent service', async () => {
      (mockedPrisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(serviceService.delete('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });
});
