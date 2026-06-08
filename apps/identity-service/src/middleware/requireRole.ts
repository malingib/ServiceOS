import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@mobiwave/shared';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      return next(new ForbiddenError('Authentication required'));
    }
    if (!roles.includes(user.role)) {
      return next(new ForbiddenError(`Required roles: ${roles.join(', ')}`));
    }
    next();
  };
}
