import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/api';

const JWT_SECRET = process.env.JWT_SECRET || 'serviceops-jwt-secret-change-in-production';

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  phone: string;
  role: string;
  email?: string;
  iat: number;
  exp: number;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
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

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(new AuthenticationError());
    }
    if (!roles.includes(authReq.user.role)) {
      return next(new ForbiddenError(`Required roles: ${roles.join(', ')}`));
    }
    next();
  };
}

export function generateTokens(payload: {
  sub: string;
  tenant_id: string;
  phone: string;
  role: string;
  email?: string;
}): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
