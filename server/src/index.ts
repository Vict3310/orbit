import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { AI_CONFIGURED, env } from './config/env.js';
import { medRouter } from './routes/med.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not permitted'));
    },
    methods: ['GET', 'POST'],
  }),
);

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'orbit-med',
    aiConfigured: AI_CONFIGURED,
    model: AI_CONFIGURED ? env.model : null,
  });
});

app.use('/api/med', medRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'NOT_FOUND' });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof Error && error.message === 'Origin not permitted') {
    response.status(403).json({ error: 'ORIGIN_NOT_ALLOWED' });
    return;
  }
  console.error('[orbit-api] unhandled error', error instanceof Error ? error.message : 'unknown');
  response.status(500).json({ error: 'INTERNAL_ERROR' });
});

const server = app.listen(env.port, '127.0.0.1', () => {
  console.log(
    `[orbit-api] listening on http://127.0.0.1:${env.port} · AI ${AI_CONFIGURED ? `enabled (${env.model})` : 'not configured (local fallback only)'}`,
  );
});

const shutdown = () => {
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
