import { Router as ExpressRouter } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router: ExpressRouter = ExpressRouter();
const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3004';

router.use(
  '/mpesa',
  createProxyMiddleware({
    target: PAYMENTS_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/:id',
  createProxyMiddleware({
    target: PAYMENTS_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/:id/status',
  createProxyMiddleware({
    target: PAYMENTS_SERVICE_URL,
    changeOrigin: true,
  }),
);

export { router as paymentRoutes };
