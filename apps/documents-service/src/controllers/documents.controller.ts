import { Request, Response, NextFunction } from 'express';
import { documentsService } from '../services/documents.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class DocumentsController {
  async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { fileName, mimeType, fileSize, category } = req.body;
      const result = await documentsService.generateUploadUrl({
        tenantId: authReq.user.tenantId,
        userId: authReq.user.id,
        fileName,
        mimeType,
        fileSize,
        category,
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

  async confirmUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { documentId, fileKey, fileName, mimeType, fileSize, category } = req.body;
      const doc = await documentsService.confirmUpload(documentId, authReq.user.tenantId, fileKey, authReq.user.id, {
        fileName, mimeType, fileSize, category,
      });
      const response: ApiResponse = {
        success: true,
        data: doc,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const result = await documentsService.getDownloadUrl(id, authReq.user.tenantId);
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

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const result = await documentsService.deleteDocument(id, authReq.user.tenantId);
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

  async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await documentsService.listDocuments(authReq.user.tenantId, {
        userId: req.query.userId as string,
        category: req.query.category as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      const response: ApiResponse = {
        success: true,
        data: result.documents,
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

export const documentsController = new DocumentsController();
