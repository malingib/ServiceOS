import { Request, Response, NextFunction } from 'express';
import { messagingService } from '../services/messaging.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class MessagingController {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId, channel, recipient, subject, body, templateId, data } = req.body;
      const result = await messagingService.send({
        tenantId: authReq.user.tenantId,
        userId,
        channel,
        recipient,
        subject,
        body,
        templateId,
        data,
      });
      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async bulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { messages } = req.body;
      const results = await messagingService.bulk(authReq.user.tenantId, messages);
      const response: ApiResponse = {
        success: true,
        data: results,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const status = await messagingService.getStatus(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: status,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const template = await messagingService.createTemplate({
        tenantId: authReq.user.tenantId,
        ...req.body,
      });
      const response: ApiResponse = {
        success: true,
        data: template,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await messagingService.listTemplates(authReq.user.tenantId, page, limit);
      const response: ApiResponse = {
        success: true,
        data: result.templates,
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

  async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const template = await messagingService.updateTemplate(id, authReq.user.tenantId, req.body);
      const response: ApiResponse = {
        success: true,
        data: template,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const messagingController = new MessagingController();
