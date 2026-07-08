import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/', (req, res, next) => healthController.get(req, res, next));
