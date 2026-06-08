import express, { Express } from 'express';
import request from 'supertest';

export function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  return app;
}

export function withAuth(app: Express, token: string) {
  return (method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string) => {
    const req = request(app)[method](url).set('Authorization', `Bearer ${token}`);
    return req;
  };
}

export async function makeRequest(
  app: Express,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  options?: {
    body?: Record<string, unknown>;
    token?: string;
    tenantId?: string;
    headers?: Record<string, string>;
  },
) {
  let req = request(app)[method](url);

  if (options?.token) {
    req = req.set('Authorization', `Bearer ${options.token}`);
  }
  if (options?.tenantId) {
    req = req.set('X-Tenant-Id', options.tenantId);
  }
  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      req = req.set(key, value);
    });
  }
  if (options?.body) {
    req = req.send(options.body);
  }

  return req;
}

export function expectSuccess(res: request.Response) {
  expect(res.status).toBeLessThan(400);
  expect(res.body.success).toBe(true);
}

export function expectPaginatedResult(res: request.Response) {
  expectSuccess(res);
  expect(res.body.meta.pagination).toBeDefined();
  expect(res.body.meta.pagination).toHaveProperty('page');
  expect(res.body.meta.pagination).toHaveProperty('total');
  expect(res.body.meta.pagination).toHaveProperty('totalPages');
}
