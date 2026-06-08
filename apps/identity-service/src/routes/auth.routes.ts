import { Router, Router as ExpressRouter } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';
import {
  otpRequestSchema,
  otpVerifySchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validateRequest,
} from '@mobiwave/shared';

const router: ExpressRouter = Router();

router.post('/otp/request', (req, res, next) => {
  const result = otpRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid phone number' } });
  }
  req.body = result.data;
  authController.requestOtp(req, res, next);
});

router.post('/otp/verify', (req, res, next) => {
  const result = otpVerifySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
  }
  req.body = result.data;
  authController.verifyOtp(req, res, next);
});

router.post('/register', (req, res, next) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid registration data' } });
  }
  req.body = result.data;
  authController.register(req, res, next);
});

router.post('/login', (req, res, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid login data' } });
  }
  req.body = result.data;
  authController.login(req, res, next);
});

router.post('/refresh', (req, res, next) => {
  const result = refreshTokenSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid refresh token' } });
  }
  req.body = result.data;
  authController.refresh(req, res, next);
});

router.post('/logout', requireAuth, (req, res, next) => authController.logout(req, res, next));
router.get('/me', requireAuth, (req, res, next) => authController.me(req, res, next));
router.get('/tenants', requireAuth, (req, res, next) => authController.tenants(req, res, next));

export { router as authRoutes };
