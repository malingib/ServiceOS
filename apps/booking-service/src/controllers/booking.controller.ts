import { Request, Response, NextFunction } from 'express';
import { bookingService, availabilityService } from '../services/booking.service';
import { ApiResponse, AuthenticatedRequest } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { serviceId, addressId, scheduledDate, scheduledStart, notes } = req.body;
      const booking = await bookingService.create({
        tenantId: authReq.user.tenantId,
        customerId: authReq.user.id,
        serviceId,
        addressId,
        scheduledDate,
        scheduledStart,
        notes,
      });
      const response: ApiResponse = {
        success: true,
        data: booking,
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
      const booking = await bookingService.getById(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: booking,
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
      const result = await bookingService.list(authReq.user.tenantId, {
        customerId: req.query.customerId as string,
        workerId: req.query.workerId as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      const response: ApiResponse = {
        success: true,
        data: result.bookings,
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

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { reason } = req.body;
      const booking = await bookingService.cancel(id, authReq.user.tenantId, authReq.user.id, reason);
      const response: ApiResponse = {
        success: true,
        data: booking,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { newDate, newStart } = req.body;
      const booking = await bookingService.reschedule(id, authReq.user.tenantId, newDate, newStart);
      const response: ApiResponse = {
        success: true,
        data: booking,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const booking = await bookingService.confirm(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: booking,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const booking = await bookingService.complete(id, authReq.user.tenantId);
      const response: ApiResponse = {
        success: true,
        data: booking,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async assignWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { workerId } = req.body;
      const booking = await bookingService.assignWorker(id, authReq.user.tenantId, workerId);
      const response: ApiResponse = {
        success: true,
        data: booking,
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async availability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { serviceId, date, workerId } = req.query;
      const result = await availabilityService.checkAvailable(
        serviceId as string,
        date as string,
        workerId as string,
        authReq.user.tenantId,
      );
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

export const bookingController = new BookingController();
