import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { createCategorySchema, updateCategorySchema } from '@habit/shared';

const router: Router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(categoryController.list));
router.post('/', validate(createCategorySchema), asyncHandler(categoryController.create));
router.patch('/:id', validate(updateCategorySchema), asyncHandler(categoryController.update));
router.delete('/:id', asyncHandler(categoryController.remove));

export default router;
