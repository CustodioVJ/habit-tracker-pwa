import { Request, Response } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/category.service';

/** GET /categories */
export async function list(req: Request, res: Response) {
  const categories = await listCategories(req.user!.id);
  res.json({ categories });
}

/** POST /categories */
export async function create(req: Request, res: Response) {
  const category = await createCategory(req.user!.id, req.body);
  res.status(201).json({ category });
}

/** PATCH /categories/:id */
export async function update(req: Request, res: Response) {
  const category = await updateCategory(req.params.id, req.user!.id, req.body);
  res.json({ category });
}

/** DELETE /categories/:id */
export async function remove(req: Request, res: Response) {
  await deleteCategory(req.params.id, req.user!.id);
  res.status(204).send();
}
