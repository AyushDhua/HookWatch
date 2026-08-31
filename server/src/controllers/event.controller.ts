import { Request, Response, NextFunction } from 'express';
import { getEventsQuerySchema } from '../lib/validation';
import * as eventService from '../services/event.service';

/**
 * GET /api/endpoints/:id/events
 * Lists events for a specific endpoint with pagination, filters, and keyword search.
 */
export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const endpointId = req.params.id;
    const query = getEventsQuerySchema.parse(req.query);

    const result = await eventService.listEvents(endpointId, req.user!.id, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/events/:id
 * Retrieves details for a specific webhook event, ensuring ownership of its endpoint.
 */
export async function getEventDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id;
    const event = await eventService.getEventDetails(eventId, req.user!.id);
    res.json({ event });
  } catch (err) {
    next(err);
  }
}
