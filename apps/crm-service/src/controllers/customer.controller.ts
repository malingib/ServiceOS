import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { homeAddress, workAddress, preferredPaymentMethod, referralCode } = req.body;
      const customer = await customerService.create({
        userId: authReq.user.id,
        tenantId: authReq.user.tenantId,
        homeAddress,
        workAddress,
        preferredPaymentMethod,
        referralCode,
      });
      const response: ApiResponse = {
        success: true,
        data: customer,
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
      const customer = await customerService.getById(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: customer,
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
      const customer = await customerService.update(id, authReq.user.tenantId, req.body);
      const response: ApiResponse = {
        success: true,
        data: customer,
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
      const result = await customerService.list(authReq.user.tenantId, page, limit);
      const response: ApiResponse = {
        success: true,
        data: result.profiles,
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
      const result = await customerService.delete(id, authReq.user.tenantId);
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

export const customerController = new CustomerController();
