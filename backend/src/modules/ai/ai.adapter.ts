import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiConfig } from '../../config/ai';
import { AppError } from '../../utils/AppError';
import { logAdapterError } from '../../middleware/errorLogger';
import { CircuitBreaker, withBackoff } from '../../utils/circuitBreaker';
import type { ParsedTicket, TicketParserPort } from './ai.port';
import { auditParsedTicket } from './ai.validator';
import { buildStructuredOcrForAi } from '../ocr/ticketLineParser';
import { SYSTEM_PROMPT } from './ai.prompt';

const geminiBreaker = new CircuitBreaker({ name: 'gemini' });

function isRetryable(err: unknown): boolean {
  if (err instanceof AppError) {
    return (
      err.code === 'AI_PARSE_ERROR' ||
      err.code === 'EXTERNAL_SERVICE_UNAVAILABLE' ||
      err.statusCode >= 500
    );
  }
  return true;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new AppError('AI response is not valid JSON', 'AI_PARSE_ERROR', 422);
  }
}

function geminiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Gemini request failed';
}

/** Gemini — API oficial Google (generativelanguage.googleapis.com). */
export class GeminiAdapter implements TicketParserPort {
  async parseTicket(cleanText: string): Promise<ParsedTicket> {
    return geminiBreaker.exec(() =>
      withBackoff(() => this.callOnce(cleanText), {
        retries: 3,
        shouldRetry: isRetryable,
      }),
    );
  }

  private async callOnce(cleanText: string): Promise<ParsedTicket> {
    if (!aiConfig.geminiApiKey) {
      throw new AppError(
        'GEMINI_API_KEY is not configured',
        'EXTERNAL_SERVICE_UNAVAILABLE',
        503,
      );
    }

    const client = new GoogleGenerativeAI(aiConfig.geminiApiKey);
    const model = client.getGenerativeModel({
      model: aiConfig.geminiModel,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        maxOutputTokens: aiConfig.maxOutputTokens,
      },
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.timeoutMs);

    try {
      const structuredText = buildStructuredOcrForAi(cleanText);
      const result = await model.generateContent(
        {
          contents: [
            { role: 'user', parts: [{ text: `TEXTO OCR:\n${structuredText}` }] },
          ],
        },
        { signal: controller.signal },
      );

      const text = result.response.text();
      if (!text) {
        throw new AppError('Gemini returned empty content', 'AI_PARSE_ERROR', 422);
      }

      const parsed = extractJson(text);
      return auditParsedTicket(parsed);
    } catch (err) {
      if (!(err instanceof AppError)) {
        logAdapterError(err, { adapter: 'gemini', operation: 'parseTicket' });
      }
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError(
          `Gemini timed out after ${aiConfig.timeoutMs / 1000}s`,
          'AI_PARSE_ERROR',
          504,
        );
      }
      throw new AppError(geminiErrorMessage(err), 'AI_PARSE_ERROR', 502);
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Mock alineado al ejemplo MDD §4.A.2 */
export class MockAiAdapter implements TicketParserPort {
  async parseTicket(_cleanText: string): Promise<ParsedTicket> {
    return auditParsedTicket({
      restaurantName: 'Pizza House',
      items: [
        { name: 'Pizza Pepperoni', unitPrice: 320, confidenceScore: 92 },
        { name: 'Refresco', unitPrice: 45, confidenceScore: 88 },
      ],
      subtotal: 365,
      tax: 58.4,
      discount: 0,
      total: 423.4,
    });
  }
}

/** @deprecated Use MockAiAdapter */
export const MockGeminiAdapter = MockAiAdapter;
