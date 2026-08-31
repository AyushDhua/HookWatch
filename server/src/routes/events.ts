import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as eventController from '../controllers/event.controller';

export const eventsRouter = Router();

// Protected route to retrieve a specific event detail
eventsRouter.get('/:id', authenticate, eventController.getEventDetails);
