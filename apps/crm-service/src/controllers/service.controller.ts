import { Request, Response, NextFunction } from 'express';
import { serviceService } from '../services/service.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class ServiceController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const service = await serviceService.create({
        tenantId: authReq.user.tenantId,
        ...req.body,
      });
      const response: ApiResponse = {
        success: true,
        data: service,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const service = await serviceService.getById(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: service,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { slug } = req.params;
      const service = await serviceService.getBySlug(slug, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: service,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const service = await serviceService.update(id, authReq.user.tenantId, req.body);
      const response: ApiResponse = {
        success: true,
        data: service,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const activeOnly = req.query.activeOnly !== 'false';
      const result = await serviceService.list(authReq.user.tenantId, page, limit, activeOnly);
      const response: ApiResponse = {
        success: true,
        data: result.services,
        meta: {
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          timestamp: new Date().toISOString(),
          pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
        },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const result = await serviceService.delete(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const serviceController = new ServiceController();
