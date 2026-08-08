import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@habit/shared';

const router: Router = Router();

// Rate limit auth endpoints to prevent brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
});

router.use(authLimiter);

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPasswordHandler),
);
router.get('/me', requireAuth, asyncHandler(authController.me));

export default router;
