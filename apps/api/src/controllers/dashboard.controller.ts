import { Request, Response } from 'express';
import { getDashboard } from '../services/dashboard.service';

/** GET /dashboard */
export async function dashboard(req: Request, res: Response) {
  const data = await getDashboard(req.user!.id, req.query.today as string | undefined);
  res.json(data);
}
