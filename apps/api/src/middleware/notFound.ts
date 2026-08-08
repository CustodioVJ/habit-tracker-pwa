import { Request, Response, NextFunction } from 'express';
import { notFound } from '../lib/errors';

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(notFound('Route not found'));
}
