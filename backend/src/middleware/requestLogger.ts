import type { RequestHandler } from 'express';

export type LogFn = (line: string) => void;

// Solo método, ruta (sin query), status y duración. Nunca headers ni body.
export function requestLogger(log: LogFn): RequestHandler {
  return (req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
      const path = req.originalUrl.split('?')[0];
      const ms = Math.round(performance.now() - start);
      log(`${req.method} ${path} ${res.statusCode} ${ms}ms`);
    });
    next();
  };
}
