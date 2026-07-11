import { env } from '../../config/env';
import { GeminiAdapter, MockAiAdapter } from './ai.adapter';
import type { ParsedTicket, TicketParserPort } from './ai.port';
import { AppError } from '../../utils/AppError';

function createParser(): TicketParserPort {
  if (env.useMockPipeline) return new MockAiAdapter();
  if (env.aiProvider === 'gemini') return new GeminiAdapter();
  return new MockAiAdapter();
}

export class AiService {
  constructor(private readonly port: TicketParserPort = createParser()) {}

  async parseTicket(cleanText: string): Promise<ParsedTicket> {
    if (!cleanText.trim()) {
      throw new AppError('cleanText is required', 'VALIDATION_ERROR', 400);
    }
    try {
      return await this.port.parseTicket(cleanText);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        err instanceof Error ? err.message : 'AI parse failed',
        'AI_PARSE_ERROR',
        502,
      );
    }
  }
}

export const aiService = new AiService();
