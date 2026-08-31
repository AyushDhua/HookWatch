import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../lib/validation';
import * as authService from '../services/auth.service';

/**
 * POST /api/auth/register
 * Validates input, delegates to authService, returns the created user.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data.name, data.email, data.password);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Validates input, delegates to authService, returns the JWT and safe user data.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (attached by the authenticate middleware).
 * No database call needed — the middleware already fetched and attached req.user.
 */
export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
