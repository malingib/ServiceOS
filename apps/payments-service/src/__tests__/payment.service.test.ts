import { paymentService } from '../services/payment.service';
import { mpesaService } from '../services/mpesa.service';
import { createMockBooking, createMockPayment, createMockTenant, createMockUser, createMockStkPushResponse, createMockMpesaCallback } from '@mobiwave/testing';
import { NotFoundError, ConflictError, PaymentError } from '@mobiwave/shared';

jest.mock('../services/mpesa.service');
jest.mock('@mobiwave/prisma', () => ({
  __esModule: true,
  default: {
    booking: { findFirst: jest.fn() },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ledgerEntry: { create: jest.fn() },
  },
}));

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

import prisma from '@mobiwave/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PaymentService', () => {
  const mockTenant = createMockTenant();
  const mockUser = createMockUser({ tenantId: mockTenant.id });
  const mockBooking = createMockBooking({ tenantId: mockTenant.id, customerId: mockUser.id });
  const mockPayment = createMockPayment({ tenantId: mockTenant.id, bookingId: mockBooking.id, customerId: mockUser.id });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateStkPush', () => {
    it('should initiate STK push successfully', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);
      (mpesaService.initiateStkPush as jest.Mock).mockResolvedValue(createMockStkPushResponse());
      (mockedPrisma.payment.update as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'PROCESSING' });

      const result = await paymentService.initiateStkPush({
        bookingId: mockBooking.id,
        phoneNumber: '+254700100200',
        amount: 2500,
        tenantId: mockTenant.id,
        customerId: mockUser.id,
      });

      expect(result.status).toBe('PROCESSING');
      expect(result.checkoutRequestId).toBeDefined();
      expect(mpesaService.initiateStkPush).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(paymentService.initiateStkPush({
        bookingId: 'non-existent',
        phoneNumber: '+254700100200',
        amount: 2500,
        tenantId: mockTenant.id,
        customerId: mockUser.id,
      })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if payment already in progress', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);

      await expect(paymentService.initiateStkPush({
        bookingId: mockBooking.id,
        phoneNumber: '+254700100200',
        amount: 2500,
        tenantId: mockTenant.id,
        customerId: mockUser.id,
      })).rejects.toThrow(ConflictError);
    });

    it('should mark payment as FAILED on M-Pesa error', async () => {
      (mockedPrisma.booking.findFirst as jest.Mock).mockResolvedValue(mockBooking);
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);
      (mpesaService.initiateStkPush as jest.Mock).mockRejectedValue(new Error('M-Pesa API error'));
      (mockedPrisma.payment.update as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'FAILED' });

      await expect(paymentService.initiateStkPush({
        bookingId: mockBooking.id,
        phoneNumber: '+254700100200',
        amount: 2500,
        tenantId: mockTenant.id,
        customerId: mockUser.id,
      })).rejects.toThrow('M-Pesa API error');

      expect(mockedPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });
  });

  describe('handleStkCallback', () => {
    it('should process successful callback', async () => {
      const mockRedis = jest.requireMock('ioredis').default;
      const redisInstance = mockRedis();
      jest.spyOn(redisInstance, 'get').mockResolvedValue(JSON.stringify({ paymentId: mockPayment.id, bookingId: mockBooking.id }));
      jest.spyOn(redisInstance, 'del').mockResolvedValue(1);

      (mockedPrisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (mockedPrisma.payment.update as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'COMPLETED' });
      (mockedPrisma.ledgerEntry.create as jest.Mock).mockResolvedValue({ id: 'ledger-1' });
      (mpesaService.parseCallbackMetadata as jest.Mock).mockReturnValue({
        MpesaReceiptNumber: 'NLJ7HGS5P7',
        TransactionDate: '20250610120000',
      });

      const callbackPayload = createMockMpesaCallback(true);
      const result = await paymentService.handleStkCallback(callbackPayload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(result.receiptNumber).toBe('NLJ7HGS5P7');
    });

    it('should handle failed callback', async () => {
      const mockRedis = jest.requireMock('ioredis').default;
      const redisInstance = mockRedis();
      jest.spyOn(redisInstance, 'get').mockResolvedValue(JSON.stringify({ paymentId: mockPayment.id, bookingId: mockBooking.id }));
      jest.spyOn(redisInstance, 'del').mockResolvedValue(1);

      (mockedPrisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (mockedPrisma.payment.update as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'FAILED' });

      const callbackPayload = createMockMpesaCallback(false);
      const result = await paymentService.handleStkCallback(callbackPayload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe('FAILED');
    });

    it('should handle duplicate callback gracefully', async () => {
      const mockRedis = jest.requireMock('ioredis').default;
      const redisInstance = mockRedis();
      jest.spyOn(redisInstance, 'get').mockResolvedValue(JSON.stringify({ paymentId: mockPayment.id, bookingId: mockBooking.id }));

      (mockedPrisma.payment.findUnique as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'COMPLETED' });

      const callbackPayload = createMockMpesaCallback(true);
      const result = await paymentService.handleStkCallback(callbackPayload);

      expect(result.processed).toBe(true);
      expect(result.reason).toBe('Already processed');
    });

    it('should throw PaymentError for invalid payload', async () => {
      await expect(paymentService.handleStkCallback({})).rejects.toThrow(PaymentError);
    });

    it('should return not processed when no pending payment in cache', async () => {
      const mockRedis = jest.requireMock('ioredis').default;
      const redisInstance = mockRedis();
      jest.spyOn(redisInstance, 'get').mockResolvedValue(null);

      const callbackPayload = createMockMpesaCallback(true);
      const result = await paymentService.handleStkCallback(callbackPayload);

      expect(result.processed).toBe(false);
    });
  });

  describe('handleB2CCallback', () => {
    it('should process successful B2C callback', async () => {
      const result = await paymentService.handleB2CCallback({
        Result: { ResultCode: 0, TransactionReceipt: 'B2C-RCPT-001' },
      });

      expect(result.processed).toBe(true);
      expect(result.status).toBe('COMPLETED');
    });

    it('should process failed B2C callback', async () => {
      const result = await paymentService.handleB2CCallback({
        Result: { ResultCode: 1, ResultDesc: 'Failed' },
      });

      expect(result.processed).toBe(true);
      expect(result.status).toBe('FAILED');
    });

    it('should throw PaymentError for invalid B2C payload', async () => {
      await expect(paymentService.handleB2CCallback({})).rejects.toThrow(PaymentError);
    });
  });

  describe('getById', () => {
    it('should return payment by ID', async () => {
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.getById(mockPayment.id, mockTenant.id);

      expect(result.id).toBe(mockPayment.id);
    });

    it('should throw NotFoundError for non-existent payment', async () => {
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(paymentService.getById('non-existent', mockTenant.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('initiateRefund', () => {
    it('should initiate refund for completed payment', async () => {
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'COMPLETED' });
      (mpesaService.initiateB2C as jest.Mock).mockResolvedValue({ ConversationID: 'conv-123' });
      (mockedPrisma.payment.update as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'REFUND_PENDING' });
      (mockedPrisma.ledgerEntry.create as jest.Mock).mockResolvedValue({ id: 'ledger-1' });

      const result = await paymentService.initiateRefund(mockPayment.id, mockTenant.id, 2500);

      expect(result.status).toBe('REFUND_PENDING');
      expect(mpesaService.initiateB2C).toHaveBeenCalled();
    });

    it('should reject refund for non-completed payment', async () => {
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'PENDING' });

      await expect(paymentService.initiateRefund(mockPayment.id, mockTenant.id, 2500))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('reconcile', () => {
    it('should reconcile pending payments', async () => {
      (mockedPrisma.payment.findMany as jest.Mock).mockResolvedValue([
        { ...mockPayment, status: 'PROCESSING', checkoutRequestId: 'checkout-1' },
      ]);
      (mpesaService.queryTransactionStatus as jest.Mock).mockResolvedValue({ ResultCode: '0' });
      (mockedPrisma.payment.update as jest.Mock).mockResolvedValue({ ...mockPayment, status: 'COMPLETED' });

      const result = await paymentService.reconcile();

      expect(result.reconciled).toBe(1);
      expect(result.results[0].status).toBe('COMPLETED');
    });

    it('should handle reconciliation errors gracefully', async () => {
      (mockedPrisma.payment.findMany as jest.Mock).mockResolvedValue([
        { ...mockPayment, status: 'PROCESSING', checkoutRequestId: 'checkout-1' },
      ]);
      (mpesaService.queryTransactionStatus as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const result = await paymentService.reconcile();

      expect(result.reconciled).toBe(1);
      expect(result.results[0].status).toBe('ERROR');
    });
  });

  describe('getStatus', () => {
    it('should return payment status', async () => {
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: mockPayment.id,
        status: 'COMPLETED',
        mpesaReceiptNumber: 'RCPT-001',
        createdAt: new Date(),
      });

      const result = await paymentService.getStatus(mockPayment.id, mockTenant.id);

      expect(result.status).toBe('COMPLETED');
    });

    it('should upgrade PROCESSING to COMPLETED if receipt exists', async () => {
      (mockedPrisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: mockPayment.id,
        status: 'PROCESSING',
        mpesaReceiptNumber: 'RCPT-001',
        createdAt: new Date(),
      });

      const result = await paymentService.getStatus(mockPayment.id, mockTenant.id);

      expect(result.status).toBe('COMPLETED');
    });
  });
});
