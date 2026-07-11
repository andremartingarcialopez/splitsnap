import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  OCR_SPACE_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-3.5-flash'),
  PIPELINE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
  CALC_TOTAL_VARIANCE_THRESHOLD: z.coerce.number().default(0.05),
  STORAGE_DIR: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

const hasOcrKey = Boolean(parsed.OCR_SPACE_API_KEY);
const hasGeminiKey = Boolean(parsed.GEMINI_API_KEY);
const hasAiKey = hasGeminiKey;
const aiProvider = hasGeminiKey ? ('gemini' as const) : ('none' as const);

const useMock =
  parsed.PIPELINE_MOCK ||
  parsed.NODE_ENV === 'test' ||
  !hasOcrKey ||
  !hasAiKey;

export const env = {
  ...parsed,
  aiProvider,
  useMockPipeline: useMock,
  corsOrigins: parsed.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  storageDir:
    parsed.STORAGE_DIR ||
    path.resolve(process.cwd(), '../storage'),
};
