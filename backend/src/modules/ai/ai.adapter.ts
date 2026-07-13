import { aiConfig } from '../../config/ai';
import { AppError } from '../../utils/AppError';
import { logAdapterError } from '../../middleware/errorLogger';
import { CircuitBreaker, withBackoff } from '../../utils/circuitBreaker';
import type { ParsedTicket, TicketParserPort } from './ai.port';
import { auditParsedTicket } from './ai.validator';
import { buildStructuredOcrForAi } from '../ocr/ticketLineParser';
import { SYSTEM_PROMPT } from './ai.prompt';

const openRouterBreaker = new CircuitBreaker({ name: 'openrouter' });

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

function openRouterHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${aiConfig.openRouterApiKey}`,
    'HTTP-Referer': aiConfig.httpReferer,
    'X-Title': aiConfig.appTitle,
  };
}

/** OpenRouter — chat completions (OpenAI-compatible). */
export class OpenRouterAdapter implements TicketParserPort {
  async parseTicket(cleanText: string): Promise<ParsedTicket> {
    return openRouterBreaker.exec(() =>
      withBackoff(() => this.callOnce(cleanText), {
        retries: 3,
        shouldRetry: isRetryable,
      }),
    );
  }

  private async callOnce(cleanText: string): Promise<ParsedTicket> {
    if (!aiConfig.openRouterApiKey) {
      throw new AppError(
        'OPENROUTER_API_KEY is not configured',
        'EXTERNAL_SERVICE_UNAVAILABLE',
        503,
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.timeoutMs);

    try {
      const structuredText = buildStructuredOcrForAi(cleanText);
      const res = await fetch(aiConfig.openRouterEndpoint, {
        method: 'POST',
        headers: openRouterHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `TEXTO OCR:\n${structuredText}` },
          ],
          temperature: 0.1,
          max_tokens: aiConfig.maxTokens,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new AppError(
          `OpenRouter HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
          res.status >= 500 ? 'AI_PARSE_ERROR' : 'VALIDATION_ERROR',
          502,
        );
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };

      if (json.error?.message) {
        throw new AppError(json.error.message, 'AI_PARSE_ERROR', 502);
      }

      const text = json.choices?.[0]?.message?.content;
      if (!text) {
        throw new AppError('OpenRouter returned empty content', 'AI_PARSE_ERROR', 422);
      }

      const parsed = extractJson(text);
      return auditParsedTicket(parsed);
    } catch (err) {
      if (!(err instanceof AppError)) {
        logAdapterError(err, { adapter: 'openrouter', operation: 'parseTicket' });
      }
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError(
          `OpenRouter timed out after ${aiConfig.timeoutMs / 1000}s`,
          'AI_PARSE_ERROR',
          504,
        );
      }
      throw new AppError(
        err instanceof Error ? err.message : 'OpenRouter request failed',
        'AI_PARSE_ERROR',
        502,
      );
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
