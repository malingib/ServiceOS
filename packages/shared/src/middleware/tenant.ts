import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/api';

export function tenantIsolation(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return next(new AuthenticationError());
  }

  const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
  const tenantId = authReq.user.tenantId;

  if (headerTenantId && headerTenantId !== tenantId) {
    return next(new ForbiddenError('Cross-tenant access denied'));
  }

  req.tenantId = tenantId;
  next();
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export function setTenantContext(prisma: { $executeRawUnsafe: (sql: string) => Promise<unknown> }) {
  return async (tenantId: string) => {
    await prisma.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
  };
}
