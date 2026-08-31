import { Request, Response, NextFunction } from 'express';

/**
 * Logs each incoming request once the response has finished.
 * Waiting for 'finish' means we can include the final status code.
 *
 * Example output:
 *   GET /api/health 200 4ms
 *   POST /api/auth/login 401 12ms
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });

  next();
}
