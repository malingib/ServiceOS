import { Router as ExpressRouter } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router: ExpressRouter = ExpressRouter();
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL || 'http://localhost:3005';
const DISPATCH_SERVICE_URL = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3007';

router.use(
  '/jobs',
  createProxyMiddleware({
    target: DISPATCH_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/earnings',
  createProxyMiddleware({
    target: CRM_SERVICE_URL,
    changeOrigin: true,
  }),
);

router.use(
  '/location',
  createProxyMiddleware({
    target: DISPATCH_SERVICE_URL,
    changeOrigin: true,
  }),
);

export { router as workerRoutes };
