import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { requestId } from './middleware/requestId';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { logger } from './lib/logger';

/** Build and configure the Express application. */
export function createApp(): Express {
  const app = express();

  // Trust proxy when behind a reverse proxy (needed for rate limiting).
  app.set('trust proxy', 1);

  // Security headers.
  app.use(helmet());

  // Request ID for log correlation.
  app.use(requestId);

  // CORS.
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );

  // Body parsing.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request logging.
  app.use((req, res, next) => {
    res.on('finish', () => {
      logger.info(
        { method: req.method, url: req.originalUrl, status: res.statusCode, reqId: req.id },
        'request',
      );
    });
    next();
  });

  // API routes.
  app.use('/api/v1', routes);

  // 404 + error handling.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
