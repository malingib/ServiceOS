import { Router, Router as ExpressRouter } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { requireAuth, requireRole, paymentRateLimit } from '@mobiwave/shared';

const router: ExpressRouter = Router();

router.post('/mpesa/stkpush', requireAuth, paymentRateLimit, (req, res, next) => paymentController.stkPush(req, res, next));
router.post('/mpesa/b2c', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), paymentRateLimit, (req, res, next) => paymentController.b2c(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => paymentController.getById(req, res, next));
router.get('/:id/status', requireAuth, (req, res, next) => paymentController.getStatus(req, res, next));
router.post('/reconcile', requireAuth, requireRole('SUPER_ADMIN'), (req, res, next) => paymentController.reconcile(req, res, next));

export { router as paymentRoutes };

const webhookRouter: ExpressRouter = Router();
webhookRouter.post('/mpesa/callback', (req, res, next) => paymentController.stkCallback(req, res, next));
webhookRouter.post('/mpesa/b2c-callback', (req, res, next) => paymentController.b2cCallback(req, res, next));

export { webhookRouter };
