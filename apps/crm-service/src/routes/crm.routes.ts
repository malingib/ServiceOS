import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { workerController } from '../controllers/worker.controller';
import { serviceController } from '../controllers/service.controller';
import { requireAuth, requireRole } from '@mobiwave/shared';

const router = Router();

router.post('/customers', requireAuth, (req, res, next) => customerController.create(req, res, next));
router.get('/customers/:id', requireAuth, (req, res, next) => customerController.getById(req, res, next));
router.put('/customers/:id', requireAuth, (req, res, next) => customerController.update(req, res, next));
router.get('/customers', requireAuth, (req, res, next) => customerController.list(req, res, next));
router.delete('/customers/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => customerController.delete(req, res, next));

router.post('/workers', requireAuth, (req, res, next) => workerController.create(req, res, next));
router.get('/workers/:id', requireAuth, (req, res, next) => workerController.getById(req, res, next));
router.put('/workers/:id', requireAuth, (req, res, next) => workerController.update(req, res, next));
router.post('/workers/:id/kyc', requireAuth, (req, res, next) => workerController.submitKyc(req, res, next));
router.get('/workers', requireAuth, (req, res, next) => workerController.list(req, res, next));
router.post('/workers/location', requireAuth, (req, res, next) => workerController.updateLocation(req, res, next));

router.post('/services', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => serviceController.create(req, res, next));
router.get('/services/:id', requireAuth, (req, res, next) => serviceController.getById(req, res, next));
router.get('/services/slug/:slug', (req, res, next) => serviceController.getBySlug(req, res, next));
router.put('/services/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => serviceController.update(req, res, next));
router.get('/services', (req, res, next) => serviceController.list(req, res, next));
router.delete('/services/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => serviceController.delete(req, res, next));

export { router as crmRoutes };
