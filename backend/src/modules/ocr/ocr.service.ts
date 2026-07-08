import { env } from '../../config/env';
import { MockOcrAdapter, OcrSpaceAdapter } from './ocr.adapter';
import type { OcrImageInput, OcrPort } from './ocr.port';
import { cleanOcrText } from './textPreprocessor';
import { AppError } from '../../utils/AppError';

function createOcrPort(): OcrPort {
  return env.useMockPipeline ? new MockOcrAdapter() : new OcrSpaceAdapter();
}

export class OcrService {
  constructor(private readonly port: OcrPort = createOcrPort()) {}

  async extractFromImage(image: OcrImageInput): Promise<{ text: string; cleaned: string }> {
    try {
      const text = await this.port.extractText(image);
      const cleaned = cleanOcrText(text);
      return { text, cleaned };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        err instanceof Error ? err.message : 'OCR failed',
        'OCR_ERROR',
        502,
      );
    }
  }
}

export const ocrService = new OcrService();
