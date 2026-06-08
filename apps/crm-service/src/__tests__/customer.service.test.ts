import { CustomerService } from '../services/customer.service';
import { createMockCustomerProfile, createMockTenant, createMockUser } from '@mobiwave/testing';
import { NotFoundError, ConflictError } from '@mobiwave/shared';

jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    customerProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: { update: jest.fn() },
  },
}));

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('CustomerService', () => {
  const customerService = new CustomerService();
  const mockTenant = createMockTenant();
  const mockUser = createMockUser({ tenantId: mockTenant.id });
  const mockProfile = createMockCustomerProfile({ userId: mockUser.id, tenantId: mockTenant.id });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a customer profile', async () => {
      (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.customerProfile.create as jest.Mock).mockResolvedValue(mockProfile);

      const result = await customerService.create({
        userId: mockUser.id,
        tenantId: mockTenant.id,
        preferredPaymentMethod: 'MPESA_STK',
      });

      expect(result.userId).toBe(mockUser.id);
    });

    it('should throw ConflictError if profile already exists', async () => {
      (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      await expect(customerService.create({
        userId: mockUser.id,
        tenantId: mockTenant.id,
      })).rejects.toThrow(ConflictError);
    });

    it('should resolve referral code', async () => {
      const referrerProfile = createMockCustomerProfile({ userId: 'referrer-id' });
      (mockedPrisma.customerProfile.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(referrerProfile);
      (mockedPrisma.customerProfile.create as jest.Mock).mockResolvedValue(mockProfile);

      await customerService.create({
        userId: mockUser.id,
        tenantId: mockTenant.id,
        referralCode: 'REF123',
      });

      const createCall = (mockedPrisma.customerProfile.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.referredBy).toBe('referrer-id');
    });
  });

  describe('getById', () => {
    it('should return customer profile', async () => {
      (mockedPrisma.customerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);

      const result = await customerService.getById(mockUser.id, mockTenant.id);

      expect(result.id).toBe(mockProfile.id);
    });

    it('should throw NotFoundError for non-existent profile', async () => {
      (mockedPrisma.customerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(customerService.getById('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update customer profile', async () => {
      (mockedPrisma.customerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockedPrisma.customerProfile.update as jest.Mock).mockResolvedValue({
        ...mockProfile,
        preferredPaymentMethod: 'CASH',
      });

      const result = await customerService.update(mockUser.id, mockTenant.id, {
        preferredPaymentMethod: 'CASH',
      });

      expect(result.preferredPaymentMethod).toBe('CASH');
    });

    it('should throw NotFoundError for non-existent profile', async () => {
      (mockedPrisma.customerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(customerService.update('non-existent', mockTenant.id, {}))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('should return paginated customer profiles', async () => {
      (mockedPrisma.customerProfile.findMany as jest.Mock).mockResolvedValue([mockProfile]);
      (mockedPrisma.customerProfile.count as jest.Mock).mockResolvedValue(1);

      const result = await customerService.list(mockTenant.id);

      expect(result.profiles).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should support pagination', async () => {
      (mockedPrisma.customerProfile.findMany as jest.Mock).mockResolvedValue([]);
      (mockedPrisma.customerProfile.count as jest.Mock).mockResolvedValue(50);

      const result = await customerService.list(mockTenant.id, 2, 10);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('delete', () => {
    it('should soft-delete customer', async () => {
      (mockedPrisma.customerProfile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await customerService.delete(mockUser.id, mockTenant.id);

      expect(result.message).toContain('deleted');
      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date), status: 'DELETED' }),
        }),
      );
    });

    it('should throw NotFoundError for non-existent profile', async () => {
      (mockedPrisma.customerProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(customerService.delete('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });
});
