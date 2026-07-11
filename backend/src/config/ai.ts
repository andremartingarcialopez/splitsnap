import { env } from './env';

export const aiConfig = {
  provider: env.aiProvider,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModel: env.GEMINI_MODEL,
  timeoutMs: 60_000,
  maxOutputTokens: 4096,
};
