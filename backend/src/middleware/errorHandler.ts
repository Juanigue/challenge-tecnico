import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';

export const notFound: RequestHandler = () => {
  throw new AppError(404, 'NOT_FOUND', 'Ruta no encontrada');
};

// Errores que lanza express.json() (body-parser).
interface BodyParserError {
  type?: string;
  status?: number;
}

// Nunca se envía el stack ni el mensaje interno al cliente.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    });
    return;
  }

  const parserError = err as BodyParserError;
  if (parserError.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'El body es demasiado grande' } });
    return;
  }
  if (parserError.type && parserError.status && parserError.status < 500) {
    res.status(400).json({ error: { code: 'INVALID_BODY', message: 'El body no es JSON válido' } });
    return;
  }

  // Solo nombre, mensaje y stack: nunca el body ni los headers del request.
  console.error('[error]', err instanceof Error ? err.stack : String(err));
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Error interno del servidor' } });
};
