import { authService, AuthService } from '../services/auth.service';
import { otpService } from '../services/otp.service';
import { keycloakService } from '../services/keycloak.service';
import { createMockUser, createMockTenant, createTestAuthTokens } from '@mobiwave/testing';
import { NotFoundError, ValidationError, AuthenticationError, ConflictError } from '@mobiwave/shared';

jest.mock('../services/otp.service');
jest.mock('../services/keycloak.service');
jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customerProfile: { create: jest.fn() },
    workerProfile: { create: jest.fn() },
    tenant: { findUnique: jest.fn() },
  },
}));
jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

import prisma from '@mobiwave/prisma';

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AuthService', () => {
  const mockTenant = createMockTenant();
  const mockUser = createMockUser({ tenantId: mockTenant.id, role: 'CUSTOMER' });

  beforeEach(() => {
    jest.clearAllMocks();
    (otpService.generate as jest.Mock).mockResolvedValue({ code: '123456', expiresIn: 300 });
    (otpService.verify as jest.Mock).mockResolvedValue(true);
    (keycloakService.createUser as jest.Mock).mockResolvedValue('kc-user-id');
    (keycloakService.assignRole as jest.Mock).mockResolvedValue(undefined);
  });

  describe('requestOtp', () => {
    it('should generate and send OTP via SMS', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

      const result = await authService.requestOtp('+254700100200');

      expect(otpService.generate).toHaveBeenCalledWith('+254700100200');
      expect(result.expiresIn).toBe(300);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not throw when SMS send fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await authService.requestOtp('+254700100200');

      expect(result.expiresIn).toBe(300);
    });
  });

  describe('register', () => {
    it('should register a new customer successfully', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockedPrisma.customerProfile.create as jest.Mock).mockResolvedValue({ id: 'profile-id' });

      const result = await authService.register({
        phone: '+254700100200',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        otp: '123456',
        tenantId: mockTenant.id,
      });

      expect(keycloakService.createUser).toHaveBeenCalled();
      expect(mockedPrisma.user.create).toHaveBeenCalled();
      expect(mockedPrisma.customerProfile.create).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.role).toBe('CUSTOMER');
    });

    it('should register a new worker successfully', async () => {
      const workerUser = createMockUser({ tenantId: mockTenant.id, role: 'WORKER' });
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.create as jest.Mock).mockResolvedValue(workerUser);
      (mockedPrisma.workerProfile.create as jest.Mock).mockResolvedValue({ id: 'profile-id' });

      const result = await authService.register({
        phone: '+254700100201',
        firstName: 'Jane',
        lastName: 'Worker',
        role: 'WORKER',
        otp: '123456',
        tenantId: mockTenant.id,
      });

      expect(mockedPrisma.workerProfile.create).toHaveBeenCalled();
      expect(result.user.role).toBe('WORKER');
    });

    it('should reject registration with invalid OTP', async () => {
      (otpService.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.register({
        phone: '+254700100200',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        otp: '000000',
        tenantId: mockTenant.id,
      })).rejects.toThrow(ValidationError);
    });

    it('should reject registration for existing phone', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.register({
        phone: '+254700100200',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        otp: '123456',
        tenantId: mockTenant.id,
      })).rejects.toThrow(ConflictError);
    });

    it('should create customer profile for CUSTOMER role', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockedPrisma.customerProfile.create as jest.Mock).mockResolvedValue({ id: 'profile-id' });

      await authService.register({
        phone: '+254700100200',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        otp: '123456',
        tenantId: mockTenant.id,
      });

      expect(mockedPrisma.customerProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            tenantId: mockTenant.id,
            referralCode: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid OTP', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login({
        phone: '+254700100200',
        otp: '123456',
        tenantId: mockTenant.id,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('should reject login with invalid OTP', async () => {
      (otpService.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({
        phone: '+254700100200',
        otp: '000000',
        tenantId: mockTenant.id,
      })).rejects.toThrow(ValidationError);
    });

    it('should reject login for non-existent user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login({
        phone: '+254700100201',
        otp: '123456',
        tenantId: mockTenant.id,
      })).rejects.toThrow(NotFoundError);
    });

    it('should reject login for deleted user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await expect(authService.login({
        phone: '+254700100200',
        otp: '123456',
        tenantId: mockTenant.id,
      })).rejects.toThrow(NotFoundError);
    });

    it('should reject login for inactive user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, status: 'INACTIVE' });

      await expect(authService.login({
        phone: '+254700100200',
        otp: '123456',
        tenantId: mockTenant.id,
      })).rejects.toThrow(AuthenticationError);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const tokens = createTestAuthTokens(mockUser.id, mockUser.tenantId);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.refresh(tokens.refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = 'expired.jwt.token';

      await expect(authService.refresh(expiredToken)).rejects.toThrow(AuthenticationError);
    });

    it('should reject refresh for deleted user', async () => {
      const tokens = createTestAuthTokens(mockUser.id, mockUser.tenantId);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await expect(authService.refresh(tokens.refreshToken)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('logout', () => {
    it('should update lastLoginAt on logout', async () => {
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await authService.logout(mockUser.id);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getMe(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.phone).toBe(mockUser.phone);
      expect(result.firstName).toBe(mockUser.firstName);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getMe('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for deleted user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await expect(authService.getMe(mockUser.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTenants', () => {
    it('should return tenants for valid user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockedPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await authService.getTenants(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockTenant.id);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getTenants('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
