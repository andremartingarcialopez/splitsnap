import { AppError } from '../../utils/AppError';

/**
 * Normaliza texto OCR: colapsa espacios/rutas ruidosas.
 * Vacío → VALIDATION_ERROR (Blueprint §4.1).
 */
export function cleanOcrText(raw: string): string {
  const cleaned = raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) {
    throw new AppError(
      'OCR text is empty after preprocessing',
      'VALIDATION_ERROR',
      422,
    );
  }
  return cleaned;
}
