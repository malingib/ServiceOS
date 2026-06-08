import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class AiController {
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { messages, options } = req.body;
      const result = await aiService.chat({
        tenantId: authReq.user.tenantId,
        userId: authReq.user.id,
        messages,
        options,
      });
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

  async summarize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { text, options } = req.body;
      const result = await aiService.summarize({
        tenantId: authReq.user.tenantId,
        userId: authReq.user.id,
        text,
        options,
      });
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

  async classify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { text, categories, options } = req.body;
      const result = await aiService.classify({
        tenantId: authReq.user.tenantId,
        userId: authReq.user.id,
        text,
        categories,
        options,
      });
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

  async getUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await aiService.getUsage(authReq.user.tenantId, {
        userId: req.query.userId as string,
        provider: req.query.provider as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      const response: ApiResponse = {
        success: true,
        data: result.logs,
        meta: {
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          timestamp: new Date().toISOString(),
          pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
          totals: result.totals as any,
        },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AiController();
