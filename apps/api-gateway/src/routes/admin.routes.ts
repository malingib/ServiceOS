import { Router as ExpressRouter } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router: ExpressRouter = ExpressRouter();
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL || 'http://localhost:3005';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
const DISPATCH_SERVICE_URL = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3007';

router.use(
  '/dashboard',
  createProxyMiddleware({
    target: CRM_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/bookings',
  createProxyMiddleware({
    target: BOOKING_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/workers',
  createProxyMiddleware({
    target: CRM_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/dispatch',
  createProxyMiddleware({
    target: DISPATCH_SERVICE_URL,
    changeOrigin: true,
  }),
);

export { router as adminRoutes };
