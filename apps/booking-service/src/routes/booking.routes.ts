import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { requireAuth, requireRole } from '@mobiwave/shared';

const router = Router();

router.post('/', requireAuth, (req, res, next) => bookingController.create(req, res, next));
router.get('/', requireAuth, (req, res, next) => bookingController.list(req, res, next));
router.get('/availability', requireAuth, (req, res, next) => bookingController.availability(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => bookingController.getById(req, res, next));
router.post('/:id/cancel', requireAuth, (req, res, next) => bookingController.cancel(req, res, next));
router.post('/:id/reschedule', requireAuth, (req, res, next) => bookingController.reschedule(req, res, next));
router.post('/:id/confirm', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'), (req, res, next) => bookingController.confirm(req, res, next));
router.post('/:id/complete', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'WORKER'), (req, res, next) => bookingController.complete(req, res, next));
router.post('/:id/assign', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'), (req, res, next) => bookingController.assignWorker(req, res, next));

export { router as bookingRoutes };
