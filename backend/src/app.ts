import express from 'express';
import path from 'node:path';
import { env } from './config/env';
import { corsMiddleware } from './config/cors';
import { groupRouter } from './routes/groups.routes';
import { participantRouter } from './routes/participants.routes';
import { healthRouter } from './routes/health.routes';
import { ocrRouter } from './routes/ocr.routes';
import { aiRouter } from './routes/ai.routes';
import { ticketRouter } from './routes/tickets.routes';
import { productRouter } from './routes/products.routes';
import { assignmentRouter } from './routes/assignments.routes';
import { historyRouter } from './routes/history.routes';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import { apiRateLimit } from './middleware/rateLimit';

export function createApp() {
  const app = express();

  app.use(securityMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));

  app.use(
    '/uploads',
    express.static(env.storageDir, {
      fallthrough: true,
      maxAge: '1d',
    }),
  );

  app.use('/api/v1', apiRateLimit);

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/groups', groupRouter);
  app.use('/api/v1/participants', participantRouter);
  app.use('/api/v1/ocr', ocrRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/tickets', ticketRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/assignments', assignmentRouter);
  app.use('/api/v1/history', historyRouter);

  app.use(errorHandler);

  return app;
}

export const storagePublicPath = path.join(env.storageDir);
