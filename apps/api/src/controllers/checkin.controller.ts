import { Request, Response } from 'express';
import { upsertCheckIn, listCheckIns, deleteCheckIn } from '../services/checkin.service';

/** PUT /habits/:habitId/check-ins */
export async function upsert(req: Request, res: Response) {
  const checkIn = await upsertCheckIn(req.params.habitId, req.user!.id, req.body);
  res.json({ checkIn });
}

/** GET /habits/:habitId/check-ins */
export async function list(req: Request, res: Response) {
  const checkIns = await listCheckIns(req.params.habitId, req.user!.id);
  res.json({ checkIns });
}

/** DELETE /habits/:habitId/check-ins/:date */
export async function remove(req: Request, res: Response) {
  await deleteCheckIn(req.params.habitId, req.user!.id, req.params.date);
  res.status(204).send();
}
