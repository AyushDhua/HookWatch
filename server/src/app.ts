import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { endpointsRouter } from './routes/endpoints';
import { eventsRouter } from './routes/events';
import { webhookRouter } from './routes/webhook';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/endpoints', endpointsRouter);
app.use('/api/events', eventsRouter);
// Public webhook receiver — no JWT, the token in the URL identifies the endpoint
app.use('/h', webhookRouter);




// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
