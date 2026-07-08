import type { NextFunction, Request, Response } from 'express';
import { ocrService } from '../modules/ocr/ocr.service';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';

export class OcrController {
  async extract(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('image file is required', 'VALIDATION_ERROR', 400);
      }
      const result = await ocrService.extractFromImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });
      sendSuccess(res, { text: result.text, cleaned: result.cleaned }, 'OCR completed');
    } catch (err) {
      next(err);
    }
  }
}

export const ocrController = new OcrController();
