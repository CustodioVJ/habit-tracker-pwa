import { Request, Response } from 'express';
import { getHabitStats, getYearHeatmap } from '../services/stats.service';

/** GET /habits/:habitId/stats?period=week|month|year */
export async function habitStats(req: Request, res: Response) {
  const period = (req.query.period as 'week' | 'month' | 'year') ?? 'month';
  const stats = await getHabitStats(
    req.params.habitId,
    req.user!.id,
    period,
    req.query.today as string | undefined,
  );
  res.json({ stats });
}

/** GET /habits/:habitId/heatmap */
export async function yearHeatmap(req: Request, res: Response) {
  const heatmap = await getYearHeatmap(
    req.params.habitId,
    req.user!.id,
    req.query.today as string | undefined,
  );
  res.json({ heatmap });
}
