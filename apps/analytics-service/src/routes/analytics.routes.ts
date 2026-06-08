import { Router, Router as ExpressRouter } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { requireAuth } from '@mobiwave/shared';

const router: ExpressRouter = Router();

router.get('/dashboard', requireAuth, (req, res, next) => analyticsController.getDashboard(req, res, next));
router.get('/bookings', requireAuth, (req, res, next) => analyticsController.getBookings(req, res, next));
router.get('/revenue', requireAuth, (req, res, next) => analyticsController.getRevenue(req, res, next));
router.get('/workers', requireAuth, (req, res, next) => analyticsController.getWorkers(req, res, next));

export { router as analyticsRoutes };
