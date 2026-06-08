import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class PaymentController {
  async stkPush(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { bookingId, phoneNumber, amountMinor } = req.body;
      const result = await paymentService.initiateStkPush({
        bookingId,
        phoneNumber,
        amountMinor,
        tenantId: authReq.user.tenantId,
        customerId: authReq.user.id,
        idempotencyKey: req.headers['idempotency-key'] as string | undefined,
      });
      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(202).json(response);
    } catch (error) {
      next(error);
    }
  }

  async stkCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.handleStkCallback(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async b2cCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.handleB2CCallback(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const payment = await paymentService.getById(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: payment,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const status = await paymentService.getStatus(id, authReq.user.tenantId);
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

  async b2c(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { destinationPhone, amountMinor, occasion } = req.body;
      const { mpesaService } = await import('../services/mpesa.service');
      const result = await mpesaService.initiateB2C({ destinationPhone, amountMinor, occasion });
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

  async reconcile(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reconciliationService } = await import('../services/reconciliation.service');
      const result = await reconciliationService.runNightlyReconciliation();
      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { requestId: _req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
