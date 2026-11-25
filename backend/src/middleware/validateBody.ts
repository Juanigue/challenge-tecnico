import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../lib/errors.js';

// Deja el body validado y normalizado en res.locals.body.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        fields[key] ??= issue.message;
      }
      throw new AppError(400, 'VALIDATION_ERROR', 'Datos inválidos', fields);
    }
    res.locals.body = result.data;
    next();
  };
}
