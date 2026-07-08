import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { pipelineRateLimit } from '../middleware/rateLimit';

export const aiRouter = Router();

aiRouter.post('/parse-ticket', pipelineRateLimit, (req, res, next) =>
  aiController.parseTicket(req, res, next),
);
