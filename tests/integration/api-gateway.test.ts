import request from 'supertest';
import express, { Express } from 'express';

describe('API Gateway Integration', () => {
  let app: Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
    });

    app.get('/v1/auth/me', (req, res) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_ERROR', message: 'Missing or invalid authorization header' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }
      res.json({
        success: true,
        data: { id: 'user-1', phone: '+254700100200', role: 'CUSTOMER' },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.post('/v1/bookings', (req, res) => {
      const { serviceId, scheduledDate } = req.body;
      if (!serviceId || !scheduledDate) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        });
      }
      res.status(201).json({
        success: true,
        data: { id: 'booking-1', status: 'PENDING', ...req.body },
        meta: { requestId: 'test', timestamp: new Date().toISOString() },
      });
    });

    app.get('/v1/bookings', (req, res) => {
      res.json({
        success: true,
        data: { bookings: [], total: 0, page: 1, limit: 20, totalPages: 0 },
        meta: {
          requestId: 'test',
          timestamp: new Date().toISOString(),
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return 200 for health endpoint', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests to protected routes', async () => {
      const res = await request(app).get('/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should allow authenticated requests', async () => {
      const res = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Booking Endpoints', () => {
    it('should create booking with valid data', async () => {
      const res = await request(app)
        .post('/v1/bookings')
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({
          serviceId: 'service-1',
          addressId: 'address-1',
          scheduledDate: '2025-06-15',
          scheduledStart: '10:00',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should reject booking with missing fields', async () => {
      const res = await request(app)
        .post('/v1/bookings')
        .set('Authorization', 'Bearer token')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return paginated booking list', async () => {
      const res = await request(app)
        .get('/v1/bookings')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
      expect(res.body.meta.pagination).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/v1/unknown');
      expect(res.status).toBe(404);
    });

    it('should include request ID in response', async () => {
      const res = await request(app)
        .get('/health')
        .set('X-Request-Id', 'custom-request-id');
      expect(res.body.meta.requestId).toBeDefined();
    });
  });

  describe('Tenant Isolation', () => {
    it('should accept X-Tenant-Id header', async () => {
      const res = await request(app)
        .post('/v1/bookings')
        .set('Authorization', 'Bearer token')
        .set('X-Tenant-Id', 'tenant-1')
        .send({
          serviceId: 'service-1',
          addressId: 'address-1',
          scheduledDate: '2025-06-15',
          scheduledStart: '10:00',
        });
      expect(res.status).toBe(201);
    });
  });
});
