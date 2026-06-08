import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { requireAuth } from '@mobiwave/shared';

const router = Router();

router.post('/', requireAuth, (req, res, next) => workflowController.create(req, res, next));
router.get('/', requireAuth, (req, res, next) => workflowController.list(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => workflowController.getById(req, res, next));
router.put('/:id', requireAuth, (req, res, next) => workflowController.update(req, res, next));
router.post('/:id/execute', requireAuth, (req, res, next) => workflowController.execute(req, res, next));

export { router as workflowRoutes };
