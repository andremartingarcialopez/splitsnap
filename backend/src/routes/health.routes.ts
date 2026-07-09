import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/live', (req, res) => healthController.live(req, res));
healthRouter.get('/', (req, res, next) => healthController.get(req, res, next));
