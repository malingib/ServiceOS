import { Router as ExpressRouter } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router: ExpressRouter = ExpressRouter();
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002';

router.use(
  '/',
  createProxyMiddleware({
    target: IDENTITY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/v1/auth': '/v1/auth' },
    on: {
      error: (err, req, res) => {
        console.error('Identity service proxy error:', err.message);
        if ('writeHead' in res) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: { code: 'SERVICE_UNAVAILABLE', message: 'Identity service is unavailable' },
            meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
          }));
        }
      },
    },
  }),
);

export { router as authRoutes };
