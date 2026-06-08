import { Router, Request, Response, NextFunction } from 'express';
import { dispatchService } from '../services/dispatch.service';
import { heartbeatService } from '../services/heartbeat.service';
import { ApiResponse, AuthenticatedRequest, requireAuth, requireRole } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/assign', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { bookingId, workerId } = req.body;
    const result = await dispatchService.assignManual({
      bookingId,
      workerId,
      tenantId: authReq.user.tenantId,
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
});

router.post('/auto-assign', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { bookingId } = req.body;
    const result = await dispatchService.autoAssign({
      bookingId,
      tenantId: authReq.user.tenantId,
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
});

router.post('/jobs/:id/state', requireAuth, requireRole('WORKER', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { state, location } = req.body;
    const result = await dispatchService.updateJobState(id, authReq.user.tenantId, state, location);
    const response: ApiResponse = {
      success: true,
      data: result,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/workers/:id/heartbeat', requireAuth, requireRole('WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { location } = req.body;
    const result = await heartbeatService.recordHeartbeat(
      authReq.user.id,
      authReq.user.tenantId,
      location,
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
});

router.get('/jobs', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = await dispatchService.listJobs(authReq.user.tenantId, { status, page, limit });
    const response: ApiResponse = {
      success: true,
      data: result.jobs,
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
});

export { router as dispatchRoutes };
