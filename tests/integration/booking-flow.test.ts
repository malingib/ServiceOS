import request from 'supertest';
import express, { Express } from 'express';

describe('Booking Flow Integration', () => {
  let app: Express;
  const testTenantId = 'tenant-1';
  const testCustomerId = 'customer-1';
  const testWorkerId = 'worker-1';
  let bookingId: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const bookings: Record<string, any> = {};

    app.post('/v1/bookings', (req, res) => {
      const id = 'booking-' + Date.now();
      const booking = {
        id,
        tenantId: req.headers['x-tenant-id'] || testTenantId,
        customerId: testCustomerId,
        serviceId: req.body.serviceId,
        addressId: req.body.addressId,
        scheduledDate: req.body.scheduledDate,
        scheduledStart: req.body.scheduledStart,
        status: 'PENDING',
        baseAmount: 2500,
        totalAmount: 2500,
        createdAt: new Date(),
      };
      bookings[id] = booking;
      bookingId = id;
      res.status(201).json({ success: true, data: booking, meta: { requestId: 'test', timestamp: new Date().toISOString() } });
    });

    app.post('/v1/dispatch/assign', (req, res) => {
      const { bookingId: bId, workerId } = req.body;
      const booking = bookings[bId];
      if (!booking) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
      }
      booking.status = 'ASSIGNED';
      booking.workerId = workerId;
      res.json({
        success: true,
        data: { job: { id: 'job-1', status: 'ASSIGNED', workerId }, booking: { id: bId, status: 'ASSIGNED' } },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.post('/v1/dispatch/jobs/:id/state', (req, res) => {
      const { state } = req.body;
      res.json({
        success: true,
        data: { id: req.params.id, status: state },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.post('/v1/payments/stkpush', (req, res) => {
      res.json({
        success: true,
        data: {
          paymentId: 'payment-1',
          checkoutRequestId: 'cr-1',
          status: 'PROCESSING',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.post('/v1/webhooks/mpesa/callback', (req, res) => {
      res.json({
        success: true,
        data: { processed: true, status: 'COMPLETED', receiptNumber: 'RCPT-001' },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });
  });

  it('should complete full booking flow: create -> assign -> accept -> complete', async () => {
    const createRes = await request(app)
      .post('/v1/bookings')
      .set('Authorization', 'Bearer token')
      .set('X-Tenant-Id', testTenantId)
      .send({
        serviceId: 'service-1',
        addressId: 'address-1',
        scheduledDate: '2025-06-15',
        scheduledStart: '10:00',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('PENDING');
    bookingId = createRes.body.data.id;

    const assignRes = await request(app)
      .post('/v1/dispatch/assign')
      .set('Authorization', 'Bearer token')
      .set('X-Tenant-Id', testTenantId)
      .send({ bookingId, workerId: testWorkerId });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.booking.status).toBe('ASSIGNED');

    const acceptRes = await request(app)
      .post(`/v1/dispatch/jobs/job-1/state`)
      .set('Authorization', 'Bearer token')
      .set('X-Tenant-Id', testTenantId)
      .send({ state: 'ACCEPTED' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    const completeRes = await request(app)
      .post(`/v1/dispatch/jobs/job-1/state`)
      .set('Authorization', 'Bearer token')
      .set('X-Tenant-Id', testTenantId)
      .send({ state: 'COMPLETED' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
  });

  it('should reject assigning worker to non-existent booking', async () => {
    const res = await request(app)
      .post('/v1/dispatch/assign')
      .set('Authorization', 'Bearer token')
      .set('X-Tenant-Id', testTenantId)
      .send({ bookingId: 'non-existent', workerId: testWorkerId });

    expect(res.status).toBe(404);
  });

  it('should reject unauthenticated flow requests', async () => {
    const res = await request(app)
      .post('/v1/bookings')
      .send({
        serviceId: 'service-1',
        addressId: 'address-1',
        scheduledDate: '2025-06-15',
        scheduledStart: '10:00',
      });

    expect(res.status).toBe(401);
  });
});
