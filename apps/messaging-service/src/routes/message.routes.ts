import { Router, Router as ExpressRouter } from 'express';
import { messagingController } from '../controllers/messaging.controller';
import { requireAuth } from '@mobiwave/shared';

const router: ExpressRouter = Router();

router.post('/send', requireAuth, (req, res, next) => messagingController.send(req, res, next));
router.post('/bulk', requireAuth, (req, res, next) => messagingController.bulk(req, res, next));
router.get('/:id/status', requireAuth, (req, res, next) => messagingController.getStatus(req, res, next));

export { router as messageRoutes };

export const templateRoutes: ExpressRouter = Router({ mergeParams: true });
templateRoutes.post('/', requireAuth, (req, res, next) => messagingController.createTemplate(req, res, next));
templateRoutes.get('/', requireAuth, (req, res, next) => messagingController.listTemplates(req, res, next));
templateRoutes.put('/:id', requireAuth, (req, res, next) => messagingController.updateTemplate(req, res, next));
