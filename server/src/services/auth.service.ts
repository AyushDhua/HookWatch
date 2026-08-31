import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';

// Fields we return to the client — password hash is intentionally excluded.
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} as const;

export async function register(name: string, email: string, password: string) {
  // Reject if the email is already registered.
  // We can safely reveal this here because the user just tried to register
  // with it — this is not an enumeration risk in the registration context.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'An account with that email already exists');
  }

  // bcrypt saltRounds=10 is the standard recommendation: secure but fast enough
  // that registration doesn't feel slow (typically ~100ms on modern hardware).
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: safeUserSelect,
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use the same error message whether the email doesn't exist or the
  // password is wrong. This prevents an attacker from using the error message
  // to discover which emails are registered (account enumeration).
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Sign a JWT containing only the user's ID. The middleware will look up
  // the user in the database on each protected request.
  const token = jwt.sign({ userId: user.id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });


  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}
