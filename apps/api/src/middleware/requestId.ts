import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Assigns a unique request ID to every request and echoes it back in the
 * response header. Used for correlating logs across the request lifecycle.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
