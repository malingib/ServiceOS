import { Request, Response, NextFunction } from 'express';
import { workerService } from '../services/worker.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class WorkerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { idNumber, skills, hourlyRate, workingHours } = req.body;
      const worker = await workerService.create({
        userId: authReq.user.id,
        tenantId: authReq.user.tenantId,
        idNumber,
        skills,
        hourlyRate,
        workingHours,
      });
      const response: ApiResponse = {
        success: true,
        data: worker,
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
      const worker = await workerService.getById(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: worker,
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
      const worker = await workerService.update(id, authReq.user.tenantId, req.body);
      const response: ApiResponse = {
        success: true,
        data: worker,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { idNumber, documentUrls } = req.body;
      const worker = await workerService.submitKyc(id, authReq.user.tenantId, { idNumber, documentUrls });
      const response: ApiResponse = {
        success: true,
        data: worker,
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
      const availableOnly = req.query.availableOnly === 'true';
      const result = await workerService.list(authReq.user.tenantId, page, limit, availableOnly);
      const response: ApiResponse = {
        success: true,
        data: result.workers,
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

  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { location } = req.body;
      const worker = await workerService.updateLocation(authReq.user.id, authReq.user.tenantId, location);
      const response: ApiResponse = {
        success: true,
        data: worker,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const workerController = new WorkerController();
