import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { accountRouter } from './auth/account.routes.js';
import { authRouter } from './auth/auth.routes.js';
import type { Config } from './config.js';
import type { Db } from './db/connection.js';
import { buildOpenApiDocument } from './docs/openapi.js';
import { createSmtpMailer, type Mailer } from './mail/mailer.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createRateLimiters } from './middleware/rateLimit.js';
import { requestLogger, type LogFn } from './middleware/requestLogger.js';

export function createApp(
  db: Db,
  config: Config,
  log: LogFn = console.log,
  mailer: Mailer = createSmtpMailer(config),
) {
  const app = express();
  const limiters = createRateLimiters(config);

  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(requestLogger(log));
  app.use(limiters.global);
  app.use(express.json({ limit: '10kb' }));

  const account = accountRouter(db, config, limiters, mailer, log);
  app.use('/auth', authRouter(db, config, limiters, { onRegistered: account.sendVerificationCode }));
  app.use('/auth', account.router);

  if (config.NODE_ENV !== 'production') {
    const document = buildOpenApiDocument();
    app.get('/docs.json', (_req, res) => res.json(document));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
