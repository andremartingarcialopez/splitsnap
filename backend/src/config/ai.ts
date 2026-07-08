import { env } from './env';

export const aiConfig = {
  provider: env.aiProvider,
  openRouterApiKey: env.OPENROUTER_API_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  model: env.OPENROUTER_MODEL,
  openRouterEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
  openRouterModelsEndpoint: 'https://openrouter.ai/api/v1/models',
  geminiEndpoint:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  geminiModel: 'gemini-2.5-flash',
  timeoutMs: 30_000,
  /** Evita 402 por créditos insuficientes (OpenRouter default ~65535). */
  maxTokens: 4096,
  httpReferer: env.OPENROUTER_HTTP_REFERER,
  appTitle: 'SplitSnap',
};
