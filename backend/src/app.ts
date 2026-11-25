import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './auth/auth.routes.js';
import type { Config } from './config.js';
import type { Db } from './db/connection.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createRateLimiters } from './middleware/rateLimit.js';
import { requestLogger, type LogFn } from './middleware/requestLogger.js';

export function createApp(db: Db, config: Config, log: LogFn = console.log) {
  const app = express();
  const limiters = createRateLimiters(config);

  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(requestLogger(log));
  app.use(limiters.global);
  app.use(express.json({ limit: '10kb' }));

  app.use('/auth', authRouter(db, config, limiters));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
