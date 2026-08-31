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
    .refine((val) => val === undefined || (/^\d+$/.test(val) && parseInt(val, 10) >= 1), {
      message: 'Page must be a positive integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .refine((val) => val === undefined || (/^\d+$/.test(val) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100), {
      message: 'Limit must be a positive integer between 1 and 100',
    })
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  method: z.string().optional(),
  status: z
    .string()
    .optional()
    .refine((val) => val === undefined || /^\d+$/.test(val), {
      message: 'Status must be a valid integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});


