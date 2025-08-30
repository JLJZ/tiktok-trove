import express from 'express';
import router from './routes/index.js';
import { notFound, errorHandler } from './middleware/errors.js';

export async function createApp() {
  const app = express();

  app.use(express.json());

  // Mount API
  app.use('/', router);

  // Health
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // 404 & error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
