import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { requireAuth } from '@mobiwave/shared';

const router = Router();

router.post('/chat', requireAuth, (req, res, next) => aiController.chat(req, res, next));
router.post('/summarize', requireAuth, (req, res, next) => aiController.summarize(req, res, next));
router.post('/classify', requireAuth, (req, res, next) => aiController.classify(req, res, next));
router.get('/usage', requireAuth, (req, res, next) => aiController.getUsage(req, res, next));

export { router as aiRoutes };
