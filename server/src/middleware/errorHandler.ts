import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

/**
 * Central error handler — mounted last in app.ts.
 * Express identifies it as an error handler because it takes four arguments.
 *
 * Handles:
 *   AppError      → the status code and message we chose when throwing
 *   ZodError      → 400 with a list of validation problems
 *   JWT errors    → 401 Unauthorized
 *   Everything else → 500 Internal Server Error (message hidden from client)
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Known application error (e.g. 404, 401, 403)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Zod validation failure — return each field's issue clearly
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      issues: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // JWT errors thrown by jsonwebtoken library
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  if (err instanceof Error && err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  // Unexpected error — log it server-side, hide internals from client
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
