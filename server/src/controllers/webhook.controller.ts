import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import * as webhookService from '../services/webhook.service';

/**
 * ANY /h/:token
 *
 * Handles incoming webhook requests for all HTTP methods.
 * No JWT required — the public token in the URL identifies the endpoint.
 *
 * The body is only captured when the request actually has content.
 * For methods like GET and HEAD that have no body, req.body will be
 * empty ({}), so we store null in the database.
 */
export async function receiveWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    // Capture body only if the request actually sent one.
    // express.json() parses JSON bodies into an object; empty/missing bodies become {}.
    const hasBody = req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0;
    const body: Prisma.InputJsonValue | null = hasBody ? (req.body as Prisma.InputJsonValue) : null;

    // req.ip is the standard Express way to get the client IP.
    // Falls back to the raw socket address if req.ip is somehow undefined.
    const sourceIp = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

    await webhookService.receiveWebhook(
      req.params.token,
      req.method,
      req.headers as unknown as Prisma.InputJsonValue,
      req.query as unknown as Prisma.InputJsonValue,
      body,
      sourceIp,
    );

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
