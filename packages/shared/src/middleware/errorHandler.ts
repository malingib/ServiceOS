import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  if (err instanceof ValidationError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: { requestId, timestamp: new Date().toISOString() },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, requestId, path: req.path }, 'Operational error');
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: { requestId, timestamp: new Date().toISOString() },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error({ err, requestId, path: req.path }, 'Unexpected error');
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
    meta: { requestId, timestamp: new Date().toISOString() },
  };
  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      requestId: (req.headers['x-request-id'] as string) || 'unknown',
      timestamp: new Date().toISOString(),
    },
  };
  res.status(404).json(response);
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = crypto.randomUUID();
  }
  next();
}
