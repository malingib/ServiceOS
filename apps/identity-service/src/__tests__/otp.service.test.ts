import { OtpService } from '../services/otp.service';

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => {
    const mock = new (RedisMock as any)();
    return mock;
  })};
});

describe('OtpService', () => {
  let otpService: OtpService;

  beforeEach(() => {
    otpService = new OtpService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generate', () => {
    it('should generate a 6-digit OTP code', async () => {
      const result = await otpService.generate('+254700100200');

      expect(result.code).toHaveLength(6);
      expect(result.code).toMatch(/^\d{6}$/);
      expect(result.expiresIn).toBe(300);
    });

    it('should generate different codes on subsequent calls', async () => {
      const result1 = await otpService.generate('+254700100200');
      const result2 = await otpService.generate('+254700100200');

      expect(result1.code).not.toBe(result2.code);
    });
  });

  describe('verify', () => {
    it('should verify correct OTP code', async () => {
      const { code } = await otpService.generate('+254700100200');

      const result = await otpService.verify('+254700100200', code);
      expect(result).toBe(true);
    });

    it('should reject incorrect OTP code', async () => {
      await otpService.generate('+254700100200');

      const result = await otpService.verify('+254700100200', '000000');
      expect(result).toBe(false);
    });

    it('should reject OTP for non-existent phone', async () => {
      const result = await otpService.verify('+254700100200', '123456');
      expect(result).toBe(false);
    });

    it('should expire OTP after 5 minutes', async () => {
      await otpService.generate('+254700100200');
      jest.advanceTimersByTime(301 * 1000);

      const result = await otpService.verify('+254700100200', '123456');
      expect(result).toBe(false);
    });

    it('should block after max failed attempts', async () => {
      await otpService.generate('+254700100200');

      for (let i = 0; i < 5; i++) {
        const result = await otpService.verify('+254700100200', '000000');
        expect(result).toBe(false);
      }

      const result = await otpService.verify('+254700100200', '000000');
      expect(result).toBe(false);
    });

    it('should consume OTP after successful verification', async () => {
      const { code } = await otpService.generate('+254700100200');

      await otpService.verify('+254700100200', code);
      const result = await otpService.verify('+254700100200', code);
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true if OTP exists', async () => {
      await otpService.generate('+254700100200');

      const result = await otpService.exists('+254700100200');
      expect(result).toBe(true);
    });

    it('should return false if OTP does not exist', async () => {
      const result = await otpService.exists('+254700100200');
      expect(result).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should delete existing OTP', async () => {
      await otpService.generate('+254700100200');
      await otpService.invalidate('+254700100200');

      const result = await otpService.exists('+254700100200');
      expect(result).toBe(false);
    });

    it('should not throw when invalidating non-existent OTP', async () => {
      await expect(otpService.invalidate('+254700100200')).resolves.not.toThrow();
    });
  });
});
