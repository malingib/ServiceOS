import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types/api';

export interface AuditEntry {
  tenantId: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  action: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function auditMiddleware(prisma: {
  auditLog: {
    create: (data: { data: AuditEntry }) => Promise<unknown>;
  };
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    req.auditLogger = async (entry: Omit<AuditEntry, 'tenantId' | 'actorId'>) => {
      try {
        await prisma.auditLog.create({
          data: {
            id: uuidv4(),
            tenantId: req.tenantId || authReq.user?.tenantId || '',
            actorId: authReq.user?.id,
            ...entry,
          },
        });
      } catch (error) {
        console.error('Audit logging failed:', error);
      }
    };
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      auditLogger?: (entry: Omit<AuditEntry, 'tenantId' | 'actorId'>) => Promise<void>;
    }
  }
}
