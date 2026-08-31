import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';

export const webhookRouter = Router();

// router.all() matches every HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
// with a single handler — no need to register each method separately.
webhookRouter.all('/:token', webhookController.receiveWebhook);
