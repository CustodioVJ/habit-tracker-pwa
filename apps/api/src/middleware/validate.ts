import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { fromZodError } from '../lib/errors';

/**
 * Validation middleware factory. Validates a request part (body, query, params)
 * against a Zod schema and replaces it with the parsed (typed) result.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(fromZodError(result.error));
    }
    // Replace the request part with the parsed value (strips unknown keys).
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}
