import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler, requestIdMiddleware, globalRateLimit } from '@mobiwave/shared';
import { aiRoutes } from './routes/ai.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3012', 10);

app.use(helmet());
app.use(requestIdMiddleware);
app.use(globalRateLimit);
app.use(morgan(':method :url :status :response-time ms - :req[x-request-id]'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-orchestrator-service', timestamp: new Date().toISOString() });
});

app.use('/v1/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AI Orchestrator Service running on port ${PORT}`);
});

export default app;
