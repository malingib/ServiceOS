export * from './types/enums';
export * from './types/index';
export * from './types/events';
export * from './types/api';

export * from './utils/errors';
export * from './utils/validators';
export * from './utils/logger';

export * from './middleware/auth';
export * from './middleware/tenant';
export * from './middleware/audit';
export * from './middleware/rateLimit';
export * from './middleware/errorHandler';

// ─── Event Emitter Interface ──────────────────────────────────────────────────
export type EventListener<T = unknown> = (payload: T) => void | Promise<void>;

export interface IEventEmitter {
  on<T>(event: string, listener: EventListener<T>): void;
  off<T>(event: string, listener: EventListener<T>): void;
  emit<T>(event: string, payload: T): void;
  once<T>(event: string, listener: EventListener<T>): void;
  removeAllListeners(event?: string): void;
}

export class EventEmitter implements IEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on<T>(event: string, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as EventListener);
  }

  off<T>(event: string, listener: EventListener<T>): void {
    this.listeners.get(event)?.delete(listener as EventListener);
  }

  emit<T>(event: string, payload: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    for (const listener of eventListeners) {
      const result = listener(payload);
      if (result instanceof Promise) {
        result.catch((err) => console.error(`[EventEmitter] Error in listener for ${event}:`, err));
      }
    }
  }

  once<T>(event: string, listener: EventListener<T>): void {
    const wrapper: EventListener<T> = (payload: T) => {
      this.off(event, wrapper);
      return listener(payload);
    };
    this.on(event, wrapper);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const globalEventEmitter = new EventEmitter();

// ─── Tenant Context Helpers ──────────────────────────────────────────────────
export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
  email?: string;
}

const tenantContextStorage = new Map<string, TenantContext>();

export function setTenantContext(context: TenantContext): string {
  const contextId = crypto.randomUUID();
  tenantContextStorage.set(contextId, context);
  return contextId;
}

export function getTenantContext(contextId: string): TenantContext | undefined {
  return tenantContextStorage.get(contextId);
}

export function clearTenantContext(contextId: string): void {
  tenantContextStorage.delete(contextId);
}

export function getCurrentTenantId(): string | undefined {
  const envTenantId = process.env.DEFAULT_TENANT_ID;
  if (envTenantId) return envTenantId;
  return undefined;
}

// ─── Common Middleware ────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { logger } from './utils/logger';
import { AuthenticationError } from './utils/errors';

export function requestLogging(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      requestId,
    }, 'HTTP request');
  });

  next();
}

export function errorTracking(err: Error, req: Request, _res: Response, next: NextFunction): void {
  logger.error({
    err,
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path,
  }, 'Unhandled error');
  next(err);
}

export function ensureAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!(req as Record<string, unknown>).user) {
    next(new AuthenticationError());
  } else {
    next();
  }
}
