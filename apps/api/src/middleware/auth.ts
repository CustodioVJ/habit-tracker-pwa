import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/tokens';
import { unauthorized } from '../lib/errors';

/** Augment Express Request with the authenticated user. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

/**
 * Authentication middleware. Verifies the Bearer access token and attaches
 * the authenticated user to the request. Rejects requests without a valid token.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(unauthorized('Invalid or expired access token'));
  }
}
