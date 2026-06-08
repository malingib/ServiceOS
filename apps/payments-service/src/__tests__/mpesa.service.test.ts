import { MpesaService } from '../services/mpesa.service';
import { MpesaError } from '@mobiwave/shared';

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

describe('MpesaService', () => {
  let mpesaService: MpesaService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mpesaService = new MpesaService();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAccessToken', () => {
    it('should fetch and cache access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token', expires_in: '3600' }),
      });

      const token1 = await (mpesaService as any).getAccessToken();
      const token2 = await (mpesaService as any).getAccessToken();

      expect(token1).toBe('test-token');
      expect(token2).toBe('test-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw MpesaError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect((mpesaService as any).getAccessToken()).rejects.toThrow(MpesaError);
    });
  });

  describe('initiateStkPush', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token', expires_in: '3600' }),
      });
    });

    it('should initiate STK push successfully', async () => {
      const expectedResponse = {
        MerchantRequestID: 'MR-001',
        CheckoutRequestID: 'CR-001',
        ResponseCode: '0',
        ResponseDescription: 'Success',
        CustomerMessage: 'Success',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedResponse,
      });

      const result = await mpesaService.initiateStkPush({
        phoneNumber: '+254700100200',
        amount: 2500,
        accountReference: 'payment-id',
        transactionDesc: 'Test payment',
      });

      expect(result.MerchantRequestID).toBe('MR-001');
      expect(result.ResponseCode).toBe('0');
    });

    it('should format phone number correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MerchantRequestID: 'MR-001',
          CheckoutRequestID: 'CR-001',
          ResponseCode: '0',
          ResponseDescription: 'Success',
          CustomerMessage: 'Success',
        }),
      });

      await mpesaService.initiateStkPush({
        phoneNumber: '0700100200',
        amount: 2500,
        accountReference: 'payment-id',
        transactionDesc: 'Test',
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(requestBody.PartyA).toBe('254700100200');
    });

    it('should throw MpesaError on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(mpesaService.initiateStkPush({
        phoneNumber: '+254700100200',
        amount: 2500,
        accountReference: 'payment-id',
        transactionDesc: 'Test',
      })).rejects.toThrow(MpesaError);
    });
  });

  describe('queryTransactionStatus', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token', expires_in: '3600' }),
      });
    });

    it('should query transaction status successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ResponseCode: '0',
          ResponseDescription: 'Success',
          MerchantRequestID: 'MR-001',
          CheckoutRequestID: 'CR-001',
          ResultCode: '0',
          ResultDesc: 'The service request is processed successfully.',
        }),
      });

      const result = await mpesaService.queryTransactionStatus('CR-001');

      expect(result.ResultCode).toBe('0');
    });

    it('should throw MpesaError on query failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      await expect(mpesaService.queryTransactionStatus('CR-001')).rejects.toThrow(MpesaError);
    });
  });

  describe('initiateB2C', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token', expires_in: '3600' }),
      });
    });

    it('should initiate B2C payment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          OriginatorConversationID: 'OC-001',
          ConversationID: 'C-001',
          ResponseCode: '0',
          ResponseDescription: 'Success',
        }),
      });

      const result = await mpesaService.initiateB2C({
        destinationPhone: '+254700100200',
        amount: 1000,
      });

      expect(result.ConversationID).toBe('C-001');
    });
  });

  describe('parseCallbackMetadata', () => {
    it('should parse callback metadata items into record', () => {
      const items = [
        { Name: 'MpesaReceiptNumber', Value: 'NLJ7HGS5P7' },
        { Name: 'TransactionDate', Value: '20250610120000' },
        { Name: 'PhoneNumber', Value: '254700100200' },
        { Name: 'Amount', Value: 2500 },
      ];

      const result = mpesaService.parseCallbackMetadata(items);

      expect(result.MpesaReceiptNumber).toBe('NLJ7HGS5P7');
      expect(result.Amount).toBe(2500);
    });

    it('should return empty object for empty items', () => {
      const result = mpesaService.parseCallbackMetadata([]);
      expect(result).toEqual({});
    });
  });
});
