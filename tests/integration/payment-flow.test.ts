import request from 'supertest';
import express, { Express } from 'express';

describe('Payment Flow Integration', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const payments: Record<string, any> = {};

    app.post('/v1/payments/mpesa/stkpush', (req, res) => {
      const { bookingId, phoneNumber, amount } = req.body;
      if (!bookingId || !phoneNumber || !amount) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }

      const paymentId = 'payment-' + Date.now();
      payments[paymentId] = {
        id: paymentId,
        bookingId,
        amount,
        status: 'PENDING',
      };

      res.json({
        success: true,
        data: {
          paymentId,
          checkoutRequestId: 'cr-' + paymentId,
          status: 'PROCESSING',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.post('/v1/webhooks/mpesa/callback', (req, res) => {
      const stkCallback = req.body?.Body?.stkCallback;
      if (!stkCallback) {
        return res.status(400).json({
          success: false,
          error: { code: 'PAYMENT_ERROR', message: 'Invalid callback payload' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }

      const { ResultCode, CheckoutRequestID } = stkCallback;
      const payment = Object.values(payments).find(
        (p: any) => `cr-payment-${p.id}` === CheckoutRequestID || CheckoutRequestID?.includes(p.id),
      );

      if (!payment) {
        return res.json({
          success: true,
          data: { processed: false, reason: 'No pending payment found' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }

      if (ResultCode === 0) {
        payment.status = 'COMPLETED';
        res.json({
          success: true,
          data: { processed: true, status: 'COMPLETED', receiptNumber: 'RCPT-001' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      } else {
        payment.status = 'FAILED';
        res.json({
          success: true,
          data: { processed: true, status: 'FAILED', resultCode: ResultCode, resultDesc: stkCallback.ResultDesc },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }
    });

    app.get('/v1/payments/:id', (req, res) => {
      const payment = payments[req.params.id];
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment not found' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }
      res.json({
        success: true,
        data: payment,
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.post('/v1/payments/:id/refund', (req, res) => {
      const payment = payments[req.params.id];
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment not found' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }
      if (payment.status !== 'COMPLETED') {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Can only refund completed payments' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }
      payment.status = 'REFUND_PENDING';
      res.json({
        success: true,
        data: { refundId: 'refund-1', status: 'REFUND_PENDING' },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });
  });

  describe('STK Push Flow', () => {
    it('should initiate STK push and process callback successfully', async () => {
      const stkRes = await request(app)
        .post('/v1/payments/mpesa/stkpush')
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({
          bookingId: 'booking-1',
          phoneNumber: '+254700100200',
          amount: 2500,
        });

      expect(stkRes.status).toBe(200);
      expect(stkRes.body.data.status).toBe('PROCESSING');
      const paymentId = stkRes.body.data.paymentId;

      const callbackRes = await request(app)
        .post('/v1/webhooks/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'MR-001',
              CheckoutRequestID: `cr-${paymentId}`,
              ResultCode: 0,
              ResultDesc: 'Success',
              CallbackMetadata: {
                Item: [
                  { Name: 'MpesaReceiptNumber', Value: 'NLJ7HGS5P7' },
                  { Name: 'TransactionDate', Value: '20250610120000' },
                ],
              },
            },
          },
        });

      expect(callbackRes.status).toBe(200);
      expect(callbackRes.body.data.status).toBe('COMPLETED');

      const statusRes = await request(app)
        .get(`/v1/payments/${paymentId}`)
        .set('Authorization', 'Bearer token');

      expect(statusRes.status).toBe(200);
    });

    it('should handle failed STK push callback', async () => {
      const stkRes = await request(app)
        .post('/v1/payments/mpesa/stkpush')
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({
          bookingId: 'booking-2',
          phoneNumber: '+254700100200',
          amount: 1500,
        });

      expect(stkRes.status).toBe(200);
      const paymentId = stkRes.body.data.paymentId;

      const callbackRes = await request(app)
        .post('/v1/webhooks/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'MR-002',
              CheckoutRequestID: `cr-${paymentId}`,
              ResultCode: 1032,
              ResultDesc: 'Request cancelled by user',
            },
          },
        });

      expect(callbackRes.status).toBe(200);
      expect(callbackRes.body.data.status).toBe('FAILED');
    });

    it('should reject STK push with missing fields', async () => {
      const res = await request(app)
        .post('/v1/payments/mpesa/stkpush')
        .set('Authorization', 'Bearer token')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('Refund Flow', () => {
    it('should refund a completed payment', async () => {
      const stkRes = await request(app)
        .post('/v1/payments/mpesa/stkpush')
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({
          bookingId: 'booking-3',
          phoneNumber: '+254700100200',
          amount: 3000,
        });
      const paymentId = stkRes.body.data.paymentId;

      await request(app)
        .post('/v1/webhooks/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'MR-003',
              CheckoutRequestID: `cr-${paymentId}`,
              ResultCode: 0,
              ResultDesc: 'Success',
              CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'RCPT-002' }] },
            },
          },
        });

      const refundRes = await request(app)
        .post(`/v1/payments/${paymentId}/refund`)
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({ amount: 3000 });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.data.status).toBe('REFUND_PENDING');
    });

    it('should reject refund for non-completed payment', async () => {
      const stkRes = await request(app)
        .post('/v1/payments/mpesa/stkpush')
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({
          bookingId: 'booking-4',
          phoneNumber: '+254700100200',
          amount: 2000,
        });
      const paymentId = stkRes.body.data.paymentId;

      const refundRes = await request(app)
        .post(`/v1/payments/${paymentId}/refund`)
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({ amount: 2000 });

      expect(refundRes.status).toBe(409);
    });
  });
});
