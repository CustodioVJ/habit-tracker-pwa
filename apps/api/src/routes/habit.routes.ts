import { Router } from 'express';
import * as habitController from '../controllers/habit.controller';
import * as checkinController from '../controllers/checkin.controller';
import * as statsController from '../controllers/stats.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createHabitSchema,
  updateHabitSchema,
  upsertCheckInSchema,
  dateParamSchema,
} from '@habit/shared';

const router: Router = Router();

router.use(requireAuth);

// Habit CRUD
router.get('/', asyncHandler(habitController.list));
router.post('/', validate(createHabitSchema), asyncHandler(habitController.create));
router.get('/:id', asyncHandler(habitController.get));
router.patch('/:id', validate(updateHabitSchema), asyncHandler(habitController.update));
router.post('/:id/archive', asyncHandler(habitController.archive));
router.post('/:id/unarchive', asyncHandler(habitController.unarchive));
router.delete('/:id', asyncHandler(habitController.remove));

// Check-ins
router.put(
  '/:habitId/check-ins',
  validate(upsertCheckInSchema),
  asyncHandler(checkinController.upsert),
);
router.get('/:habitId/check-ins', asyncHandler(checkinController.list));
router.delete(
  '/:habitId/check-ins/:date',
  validate(dateParamSchema, 'params'),
  asyncHandler(checkinController.remove),
);

// Stats
router.get('/:habitId/stats', asyncHandler(statsController.habitStats));
router.get('/:habitId/heatmap', asyncHandler(statsController.yearHeatmap));

export default router;
