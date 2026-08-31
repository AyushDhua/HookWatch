import { z } from 'zod';

// Shared Zod schemas for validating incoming request bodies.
// These are called with .parse() in controllers — if validation fails,
// Zod throws a ZodError which the central errorHandler converts to a 400.

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
