import { Router } from 'express';
import authRoutes from './auth.routes';
import habitRoutes from './habit.routes';
import categoryRoutes from './category.routes';
import * as dashboardController from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/habits', habitRoutes);
router.use('/categories', categoryRoutes);
router.get('/dashboard', requireAuth, asyncHandler(dashboardController.dashboard));

export default router;
