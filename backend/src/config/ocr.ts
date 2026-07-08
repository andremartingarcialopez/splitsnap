import { env } from './env';

export const ocrConfig = {
  apiKey: env.OCR_SPACE_API_KEY,
  endpoint: 'https://api.ocr.space/parse/image',
  timeoutMs: 5_000,
  language: 'spa',
};
