import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = Router();
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';

router.use(
  '/',
  createProxyMiddleware({
    target: BOOKING_SERVICE_URL,
    changeOrigin: true,
  }),
);

export { router as bookingRoutes };
