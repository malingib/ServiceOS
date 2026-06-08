import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = Router();
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002';

router.use(
  '/',
  createProxyMiddleware({
    target: IDENTITY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/v1/auth': '/v1/auth' },
    onError: (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Identity service proxy error:', err.message);
      res.status(502).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Identity service is unavailable' },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    },
  }),
);

export { router as authRoutes };
