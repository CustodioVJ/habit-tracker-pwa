import { ZodError } from 'zod';

/**
 * Application error with an HTTP status code and a stable error code.
 * All errors thrown by services/controllers should use this class so the
 * centralized error handler can produce a consistent response shape.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/** 400 Bad Request */
export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, details);

/** 401 Unauthorized */
export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message);

/** 403 Forbidden */
export const forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError(403, 'FORBIDDEN', message);

/** 404 Not Found */
export const notFound = (message = 'Resource not found') =>
  new AppError(404, 'NOT_FOUND', message);

/** 409 Conflict */
export const conflict = (message: string) => new AppError(409, 'CONFLICT', message);

/** 422 Unprocessable Entity */
export const unprocessable = (message: string, details?: unknown) =>
  new AppError(422, 'UNPROCESSABLE_ENTITY', message, details);

/** 429 Too Many Requests */
export const tooManyRequests = (message = 'Too many requests, please try again later') =>
  new AppError(429, 'RATE_LIMITED', message);

/** Convert a ZodError into an AppError with field details. */
export const fromZodError = (error: ZodError) => {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return unprocessable('Validation failed', details);
};
