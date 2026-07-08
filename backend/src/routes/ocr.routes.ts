import { Router } from 'express';
import { ocrController } from '../controllers/ocr.controller';
import { uploadTicketImage } from '../middleware/upload';
import { pipelineRateLimit } from '../middleware/rateLimit';

export const ocrRouter = Router();

ocrRouter.post(
  '/',
  pipelineRateLimit,
  uploadTicketImage,
  (req, res, next) => ocrController.extract(req, res, next),
);
