import { Request, Response, NextFunction } from 'express';
import { ZodIssue, ZodSchema } from 'zod';
import { ValidationError } from '@mobiwave/shared';

export function validateRequest(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      const formattedErrors: Record<string, string[]> = {};
      result.error.errors.forEach((err: ZodIssue) => {
        const path = err.path.join('.');
        if (!formattedErrors[path]) formattedErrors[path] = [];
        formattedErrors[path].push(err.message);
      });
      throw new ValidationError('Request validation failed', formattedErrors);
    }
    (req as any)[source] = result.data;
    next();
  };
}
