import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logAdapterError } from '../middleware/errorLogger';
import { sendError } from '../utils/response';

const EXTERNAL_CODES = new Set([
  'OCR_ERROR',
  'AI_PARSE_ERROR',
  'EXTERNAL_SERVICE_UNAVAILABLE',
]);

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (EXTERNAL_CODES.has(err.code)) {
      logAdapterError(err, {
        adapter: err.code.startsWith('OCR') ? 'ocr' : 'ai',
        code: err.code,
        statusCode: err.statusCode,
      });
    }
    sendError(res, err.message, err.code, err.statusCode, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 'VALIDATION_ERROR', 400, err.flatten());
    return;
  }

  console.error('[api]', err);
  sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
}
