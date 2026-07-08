import { ocrConfig } from '../../config/ocr';
import { AppError } from '../../utils/AppError';
import { logAdapterError } from '../../middleware/errorLogger';
import { CircuitBreaker, withBackoff } from '../../utils/circuitBreaker';
import type { OcrImageInput, OcrPort } from './ocr.port';

const breaker = new CircuitBreaker({ name: 'ocr-space' });

function isRetryable(err: unknown): boolean {
  if (err instanceof AppError) {
    return err.code === 'OCR_ERROR' || err.code === 'EXTERNAL_SERVICE_UNAVAILABLE';
  }
  return true;
}

/**
 * OCR.Space adapter — MDD §4.B
 * Timeout 5s, Circuit Breaker, backoff 1s/2s/4s.
 */
export class OcrSpaceAdapter implements OcrPort {
  async extractText(image: OcrImageInput): Promise<string> {
    return breaker.exec(() =>
      withBackoff(() => this.callOnce(image), {
        retries: 3,
        shouldRetry: isRetryable,
      }),
    );
  }

  private async callOnce(image: OcrImageInput): Promise<string> {
    if (!ocrConfig.apiKey) {
      throw new AppError(
        'OCR_SPACE_API_KEY is not configured',
        'EXTERNAL_SERVICE_UNAVAILABLE',
        503,
      );
    }

    const form = new FormData();
    form.append('language', ocrConfig.language);
    form.append('isOverlayRequired', 'false');
    form.append('OCREngine', '2');
    form.append(
      'file',
      new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }),
      image.originalName || 'ticket.jpg',
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ocrConfig.timeoutMs);

    try {
      const res = await fetch(ocrConfig.endpoint, {
        method: 'POST',
        headers: { apikey: ocrConfig.apiKey },
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new AppError(
          `OCR.Space HTTP ${res.status}`,
          res.status >= 500 ? 'OCR_ERROR' : 'VALIDATION_ERROR',
          502,
        );
      }

      const json = (await res.json()) as {
        IsErroredOnProcessing?: boolean;
        ErrorMessage?: string | string[];
        ParsedResults?: Array<{ ParsedText?: string }>;
      };

      if (json.IsErroredOnProcessing) {
        const msg = Array.isArray(json.ErrorMessage)
          ? json.ErrorMessage.join('; ')
          : json.ErrorMessage || 'OCR processing error';
        throw new AppError(msg, 'OCR_ERROR', 502);
      }

      const text = json.ParsedResults?.[0]?.ParsedText?.trim() ?? '';
      if (!text) {
        throw new AppError(
          'OCR returned empty text. Try a clearer photo or enter products manually.',
          'OCR_ERROR',
          422,
        );
      }
      return text;
    } catch (err) {
      if (!(err instanceof AppError)) {
        logAdapterError(err, { adapter: 'ocr', operation: 'extractText' });
      }
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('OCR timed out after 5s', 'OCR_ERROR', 504);
      }
      throw new AppError(
        err instanceof Error ? err.message : 'OCR request failed',
        'OCR_ERROR',
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Mock determinista para desarrollo sin API key */
export class MockOcrAdapter implements OcrPort {
  async extractText(_image: OcrImageInput): Promise<string> {
    return [
      'Pizza House',
      'Pizza Pepperoni 320.00',
      'Refresco 45.00',
      'SUBTOTAL 365.00',
      'IVA 58.40',
      'TOTAL 423.40',
    ].join('\n');
  }
}
