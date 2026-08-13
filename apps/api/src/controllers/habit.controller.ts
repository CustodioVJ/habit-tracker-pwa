import { Request, Response } from 'express';
import {
  listHabits,
  getHabit,
  createHabit,
  updateHabit,
  archiveHabit,
  unarchiveHabit,
  deleteHabit,
} from '../services/habit.service';

/** GET /habits */
export async function list(req: Request, res: Response) {
  const habits = await listHabits(req.user!.id, {
    includeArchived: req.query.includeArchived === 'true',
    categoryId: req.query.categoryId as string | undefined,
    today: req.query.today as string | undefined,
  });
  res.json({ habits });
}

/** GET /habits/:id */
export async function get(req: Request, res: Response) {
  const habit = await getHabit(
    req.params.id,
    req.user!.id,
    req.query.today as string | undefined,
  );
  res.json({ habit });
}

/** POST /habits */
export async function create(req: Request, res: Response) {
  const habit = await createHabit(req.user!.id, req.body);
  res.status(201).json({ habit });
}

/** PATCH /habits/:id */
export async function update(req: Request, res: Response) {
  const habit = await updateHabit(req.params.id, req.user!.id, req.body);
  res.json({ habit });
}

/** POST /habits/:id/archive */
export async function archive(req: Request, res: Response) {
  const habit = await archiveHabit(req.params.id, req.user!.id);
  res.json({ habit });
}

/** POST /habits/:id/unarchive */
export async function unarchive(req: Request, res: Response) {
  const habit = await unarchiveHabit(req.params.id, req.user!.id);
  res.json({ habit });
}

/** DELETE /habits/:id */
export async function remove(req: Request, res: Response) {
  await deleteHabit(req.params.id, req.user!.id);
  res.status(204).send();
}
