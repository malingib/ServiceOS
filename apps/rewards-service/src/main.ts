import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler, requestIdMiddleware, globalRateLimit } from '@mobiwave/shared';
import { rewardsRoutes, promotionRoutes } from './routes/rewards.routes';

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3008', 10);

app.use(helmet());
app.use(requestIdMiddleware);
app.use(globalRateLimit);
app.use(morgan(':method :url :status :response-time ms - :req[x-request-id]'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rewards-service', timestamp: new Date().toISOString() });
});

app.use('/v1/rewards', rewardsRoutes);
app.use('/v1/promotions', promotionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Rewards Service running on port ${PORT}`);
});

export default app;
