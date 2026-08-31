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

export const createEndpointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

export const getEventsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 1;
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20;
      if (isNaN(parsed) || parsed < 1) return 20;
      return Math.min(100, parsed);
    }),
  search: z.string().optional(),
  method: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }),
});


