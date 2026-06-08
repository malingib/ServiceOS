import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler, requestIdMiddleware, globalRateLimit } from '@mobiwave/shared';
import { analyticsRoutes } from './routes/analytics.routes';

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3011', 10);

app.use(helmet());
app.use(requestIdMiddleware);
app.use(globalRateLimit);
app.use(morgan(':method :url :status :response-time ms - :req[x-request-id]'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'analytics-service', timestamp: new Date().toISOString() });
});

app.use('/v1/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});

export default app;
