import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

const SENSITIVE_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'password',
  'passwordHash',
  'pin',
  'otp',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'securityCredential',
  'consumerKey',
  'consumerSecret',
  'passkey',
  'ssn',
  'idNumber',
  'creditCard',
  'cvv',
];

const ENV_LOG_LEVELS: Record<string, pino.LevelWithSilent> = {
  development: 'debug',
  staging: 'info',
  production: 'info',
  test: 'silent',
};

function getLogLevel(): pino.LevelWithSilent {
  const env = process.env.NODE_ENV || 'development';
  return (process.env.LOG_LEVEL as pino.LevelWithSilent) || ENV_LOG_LEVELS[env] || 'info';
}

function getRedactPaths(): string[] {
  if (process.env.LOG_REDACT_PATHS) {
    return [...SENSITIVE_PATHS, ...process.env.LOG_REDACT_PATHS.split(',')];
  }
  return SENSITIVE_PATHS;
}

export const logger = pino({
  level: getLogLevel(),
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: getRedactPaths(),
    censor: '[REDACTED]',
  },
});

export function createChildLogger(name: string, context?: Record<string, unknown>) {
  return logger.child({ service: name, ...context });
}

type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export function requestLoggingMiddleware(): AsyncMiddleware {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    const childLogger = createChildLogger('http', {
      correlationId,
      method: req.method,
      path: req.path,
      query: req.query,
    });

    childLogger.debug({ body: sanitizeBody(req.body) }, 'incoming request');

    const originalEnd = res.end.bind(res);
    res.end = function (this: Response, ...args: Parameters<Response['end']>) {
      const duration = Date.now() - start;
      childLogger.info(
        {
          statusCode: res.statusCode,
          durationMs: duration,
          contentLength: res.getHeader('content-length'),
        },
        'request completed',
      );
      return originalEnd(...args);
    } as Response['end'];

    req.logger = childLogger;
    next();
  };
}

export function correlationIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.correlationId = correlationId;
  next();
}

export function setCorrelationId(correlationId?: string): string {
  return correlationId || uuidv4();
}

export function addRedactPath(path: string): void {
  if (!SENSITIVE_PATHS.includes(path)) {
    SENSITIVE_PATHS.push(path);
  }
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body as Record<string, unknown> };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_PATHS.some((p) => p.endsWith(key) || p.includes(key))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      logger?: pino.Logger;
    }
  }
}

export default logger;
