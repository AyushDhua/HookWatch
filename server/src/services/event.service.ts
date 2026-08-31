import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';
import { Prisma } from '@prisma/client';

export interface GetEventsOptions {
  page: number;
  limit: number;
  search?: string;
  method?: string;
  status?: number;
}

export async function listEvents(endpointId: string, userId: string, options: GetEventsOptions) {
  // 1. Verify endpoint exists and belongs to the authenticated user first.
  // This acts as a strict authorization check.
  const endpoint = await prisma.endpoint.findFirst({
    where: { id: endpointId, userId },
  });

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  const { page, limit, search, method, status } = options;

  // 2. Build where filter conditions
  const where: Prisma.WebhookEventWhereInput = {
    endpointId,
  };

  if (method) {
    where.method = { equals: method, mode: 'insensitive' };
  }

  if (status !== undefined) {
    where.statusCode = status;
  }

  if (search) {
    where.OR = [
      { method: { contains: search, mode: 'insensitive' } },
      { sourceIp: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 3. Query database with pagination and ordering
  const skip = (page - 1) * limit;

  const [events, total] = await prisma.$transaction([
    prisma.webhookEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { receivedAt: 'desc' },
    }),
    prisma.webhookEvent.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getEventDetails(eventId: string, userId: string) {
  // Retrieve the event and verify ownership of the associated endpoint in one query.
  // This prevents accessing other users' events by guessing/brute-forcing event IDs.
  const event = await prisma.webhookEvent.findFirst({
    where: {
      id: eventId,
      endpoint: {
        userId,
      },
    },
  });

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  return event;
}
