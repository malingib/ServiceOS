import { Router, Router as ExpressRouter } from 'express';
import { rewardsController } from '../controllers/rewards.controller';
import { requireAuth } from '@mobiwave/shared';

const router: ExpressRouter = Router();

router.post('/referrals', requireAuth, (req, res, next) => rewardsController.createReferral(req, res, next));
router.get('/:userId/points', requireAuth, (req, res, next) => rewardsController.getPoints(req, res, next));
router.post('/:userId/redeem', requireAuth, (req, res, next) => rewardsController.redeemPoints(req, res, next));

export { router as rewardsRoutes };

export const promotionRoutes: ExpressRouter = Router();
promotionRoutes.get('/', requireAuth, (req, res, next) => rewardsController.listPromotions(req, res, next));
