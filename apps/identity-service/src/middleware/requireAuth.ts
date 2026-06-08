import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '@mobiwave/shared';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'serviceops-jwt-secret-change-in-production';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    // Try to verify with our JWT_SECRET first (for backward compatibility)
    let decoded: {
      sub: string;
      tenant_id: string;
      phone: string;
      role: string;
      email?: string;
    };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        tenant_id: string;
        phone: string;
        role: string;
        email?: string;
      };
    } catch {
      // If that fails, try Supabase JWT (if configured)
      if (!SUPABASE_JWT_SECRET) {
        throw new Error('Invalid token');
      }
      decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as {
        sub: string;
        tenant_id: string;
        phone: string;
        role: string;
        email?: string;
      };
    }
    
    (req as any).user = {
      id: decoded.sub,
      tenantId: decoded.tenant_id,
      phone: decoded.phone,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Token expired'));
    }
    return next(new AuthenticationError('Invalid token'));
  }
}
