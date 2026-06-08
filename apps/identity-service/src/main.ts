import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler, notFoundHandler, requestIdMiddleware, authRateLimit } from '@mobiwave/shared';
import { authRoutes } from './routes/auth.routes';

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

app.use(helmet());
app.use(requestIdMiddleware);
app.use(morgan(':method :url :status :response-time ms - :req[x-request-id]'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'identity-service', timestamp: new Date().toISOString() });
});

app.use('/v1/auth', authRateLimit, authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Identity Service running on port ${PORT}`);
});

export default app;
