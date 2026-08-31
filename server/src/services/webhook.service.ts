import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

/**
 * receiveWebhook — the core HookWatch function.
 *
 * Flow:
 *   1. Look up the endpoint by its publicToken
 *   2. Verify the endpoint exists (404 if not)
 *   3. Verify the endpoint is active (403 if inactive)
 *   4. Store the incoming request as a WebhookEvent
 *
 * statusCode 200 is stored because that is the HTTP status we return to
 * the webhook sender when the request is successfully received.
 */
export async function receiveWebhook(
  token: string,
  method: string,
  headers: Prisma.InputJsonValue,
  queryParams: Prisma.InputJsonValue,
  body: Prisma.InputJsonValue | null,
  sourceIp: string,
) {
  const endpoint = await prisma.endpoint.findUnique({
    where: { publicToken: token },
  });

  if (!endpoint) {
    throw new AppError(404, 'Webhook endpoint not found');
  }

  if (!endpoint.isActive) {
    throw new AppError(403, 'Webhook endpoint is inactive');
  }

  await prisma.webhookEvent.create({
    data: {
      endpointId: endpoint.id,
      method,
      headers,
      queryParams,
      // body is Json? (nullable) — use Prisma.DbNull for SQL NULL when there is no body.
      // This correctly distinguishes "no body" from a JSON null value.
      body: body !== null ? body : Prisma.DbNull,
      sourceIp,
      statusCode: 200,
    },
  });
}
