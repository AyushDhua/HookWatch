import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as endpointController from '../controllers/endpoint.controller';

export const endpointsRouter = Router();

// All endpoint routes require authentication
endpointsRouter.post('/', authenticate, endpointController.createEndpoint);
endpointsRouter.get('/', authenticate, endpointController.listEndpoints);
endpointsRouter.get('/:id', authenticate, endpointController.getEndpoint);
endpointsRouter.delete('/:id', authenticate, endpointController.deleteEndpoint);
