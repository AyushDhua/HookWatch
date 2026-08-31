import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

// Generate a public webhook token: 32 hex characters (128 bits of randomness).
// This is cryptographically random, URL-safe, and statistically unique.
// We use crypto from Node's standard library — no extra dependency needed.
function generateToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function createEndpoint(userId: string, name: string) {
  const endpoint = await prisma.endpoint.create({
    data: {
      userId,
      name,
      publicToken: generateToken(),
    },
  });
  return endpoint;
}

export async function listEndpoints(userId: string) {
  return prisma.endpoint.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// For get and delete we filter by BOTH id AND userId.
// If the endpoint belongs to a different user, the query returns null and we
// respond with 404 — the same response as "not found". This means an attacker
// cannot tell whether an endpoint ID belongs to someone else or simply doesn't
// exist. This pattern is sometimes called "opaque 404".
export async function getEndpoint(id: string, userId: string) {
  const endpoint = await prisma.endpoint.findFirst({
    where: { id, userId },
  });

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  return endpoint;
}

export async function deleteEndpoint(id: string, userId: string) {
  const endpoint = await prisma.endpoint.findFirst({
    where: { id, userId },
  });

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  // Cascade delete (defined in the Prisma schema) will automatically remove
  // all WebhookEvents belonging to this endpoint.
  await prisma.endpoint.delete({ where: { id } });
}
