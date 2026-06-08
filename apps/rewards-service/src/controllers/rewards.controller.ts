import { Request, Response, NextFunction } from 'express';
import { rewardsService } from '../services/rewards.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class RewardsController {
  async createReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { referredId } = req.body;
      const referral = await rewardsService.createReferral({
        tenantId: authReq.user.tenantId,
        referrerId: authReq.user.id,
        referredId,
      });
      const response: ApiResponse = {
        success: true,
        data: referral,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;
      const points = await rewardsService.getPoints(userId, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: points,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async redeemPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;
      const { points } = req.body;
      const result = await rewardsService.redeemPoints(userId, authReq.user.tenantId, points);
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

  async listPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await rewardsService.listPromotions(authReq.user.tenantId, page, limit);
      const response: ApiResponse = {
        success: true,
        data: result.promotions,
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
}

export const rewardsController = new RewardsController();
