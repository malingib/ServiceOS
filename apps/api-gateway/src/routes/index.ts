import { Router as ExpressRouter } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { requireAuth } from '@mobiwave/shared';
import { authRoutes } from './auth.routes';
import { bookingRoutes } from './booking.routes';
import { paymentRoutes } from './payment.routes';
import { workerRoutes } from './worker.routes';
import { adminRoutes } from './admin.routes';

const router: ExpressRouter = ExpressRouter();

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3004';
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL || 'http://localhost:3005';
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';
const DISPATCH_SERVICE_URL = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3007';

router.use('/auth', authRoutes);

router.use('/services', createProxyMiddleware({
  target: CRM_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/v1/services': '/v1/services' },
}));

router.use('/customers', requireAuth, createProxyMiddleware({
  target: CRM_SERVICE_URL,
  changeOrigin: true,
}));

router.use('/workers', requireAuth, createProxyMiddleware({
  target: CRM_SERVICE_URL,
  changeOrigin: true,
}));

router.use('/addresses', requireAuth, createProxyMiddleware({
  target: CRM_SERVICE_URL,
  changeOrigin: true,
}));

router.use('/bookings', requireAuth, bookingRoutes);

router.use('/payments', requireAuth, paymentRoutes);

router.use('/worker', requireAuth, workerRoutes);

router.use('/dispatch', requireAuth, adminRoutes);

router.use('/webhooks', createProxyMiddleware({
  target: PAYMENTS_SERVICE_URL,
  changeOrigin: true,
}));

router.use('/notifications', requireAuth, createProxyMiddleware({
  target: MESSAGING_SERVICE_URL,
  changeOrigin: true,
}));

export { router as routeAggregator };
