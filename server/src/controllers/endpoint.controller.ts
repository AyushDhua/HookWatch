import { Request, Response, NextFunction } from 'express';
import { createEndpointSchema } from '../lib/validation';
import * as endpointService from '../services/endpoint.service';

/**
 * POST /api/endpoints
 * Creates a new webhook endpoint for the authenticated user.
 */
export async function createEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = createEndpointSchema.parse(req.body);
    const endpoint = await endpointService.createEndpoint(req.user!.id, name);
    res.status(201).json({ endpoint });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/endpoints
 * Returns all endpoints belonging to the authenticated user.
 */
export async function listEndpoints(req: Request, res: Response, next: NextFunction) {
  try {
    const endpoints = await endpointService.listEndpoints(req.user!.id);
    res.json({ endpoints });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/endpoints/:id
 * Returns a single endpoint. Responds 404 if not found or owned by someone else.
 */
export async function getEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const endpoint = await endpointService.getEndpoint(req.params.id, req.user!.id);
    res.json({ endpoint });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/endpoints/:id
 * Deletes an endpoint and (via cascade) all its webhook events.
 * Responds 404 if not found or owned by someone else.
 */
export async function deleteEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    await endpointService.deleteEndpoint(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
