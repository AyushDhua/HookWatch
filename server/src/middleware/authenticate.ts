import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';
import prisma from '../lib/prisma';

/**
 * Authenticate middleware — verifies the Bearer JWT on protected routes.
 *
 * Flow:
 *   1. Extract the token from the Authorization header
 *   2. Verify the token signature and expiry using jwt.verify
 *   3. Look up the user in the database by the userId in the token payload
 *   4. Attach the user to req.user so controllers can use it
 *
 * If anything fails, we call next(err) and the central errorHandler handles it.
 * JWT errors (JsonWebTokenError, TokenExpiredError) are already handled there.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.slice(7); // Remove the "Bearer " prefix

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return next(new AppError(401, 'User not found'));
    }

    req.user = user;
    next();
  } catch (err) {
    // Passes JsonWebTokenError / TokenExpiredError to the central error handler
    next(err);
  }
}
