import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { aiConfig } from '../../config/ai';
import { ocrConfig } from '../../config/ocr';

const HEALTH_TIMEOUT_MS = 5_000;

export type ServiceHealth = {
  status: 'up' | 'down' | 'mock' | 'missing_key';
  latencyMs?: number;
  message?: string;
};

export type HealthReport = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  pipelineMock: boolean;
  services: {
    database: ServiceHealth;
    ocr: ServiceHealth;
    /** Parser IA (Gemini). */
    ai: ServiceHealth;
    /** @deprecated Alias de `ai` para compatibilidad. */
    gemini: ServiceHealth;
  };
};

const startedAt = Date.now();

async function withTimeout<T>(
  label: string,
  fn: () => Promise<T>,
  timeoutMs = HEALTH_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

async function pingDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await withTimeout('database', () => prisma.$queryRaw`SELECT 1`);
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Database unreachable',
    };
  }
}

async function pingOcr(): Promise<ServiceHealth> {
  if (env.useMockPipeline) {
    return { status: 'mock', latencyMs: 0 };
  }
  if (!ocrConfig.apiKey) {
    return { status: 'missing_key', message: 'OCR_SPACE_API_KEY not configured' };
  }

  const start = Date.now();
  try {
    await withTimeout('ocr', async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      try {
        const form = new FormData();
        form.append('language', ocrConfig.language);
        const res = await fetch(ocrConfig.endpoint, {
          method: 'POST',
          headers: { apikey: ocrConfig.apiKey },
          body: form,
          signal: controller.signal,
        });
        // Cualquier respuesta HTTP del proveedor indica reachability (incluso 4xx sin imagen).
        if (res.status >= 500) {
          throw new Error(`OCR.Space HTTP ${res.status}`);
        }
      } finally {
        clearTimeout(timer);
      }
    });
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'OCR unreachable',
    };
  }
}

async function pingAi(): Promise<ServiceHealth> {
  if (env.useMockPipeline) {
    return { status: 'mock', latencyMs: 0 };
  }

  if (aiConfig.provider === 'gemini') {
    if (!aiConfig.geminiApiKey) {
      return { status: 'missing_key', message: 'GEMINI_API_KEY not configured' };
    }

    const start = Date.now();
    const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.geminiModel}?key=${encodeURIComponent(aiConfig.geminiApiKey)}`;

    try {
      await withTimeout('gemini', async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
        try {
          const res = await fetch(modelUrl, { method: 'GET', signal: controller.signal });
          if (!res.ok) {
            throw new Error(`Gemini HTTP ${res.status}`);
          }
        } finally {
          clearTimeout(timer);
        }
      });
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Gemini unreachable',
      };
    }
  }

  return { status: 'missing_key', message: 'No AI provider configured' };
}

function aggregateStatus(services: HealthReport['services']): HealthReport['status'] {
  if (services.database.status === 'down') return 'unhealthy';

  const external = [services.ocr, services.ai];
  const allOk = external.every(
    (s) => s.status === 'up' || s.status === 'mock',
  );
  if (allOk) return 'healthy';

  const anyDown = external.some((s) => s.status === 'down');
  return anyDown ? 'degraded' : 'healthy';
}

export class HealthService {
  async check(): Promise<HealthReport> {
    const [database, ocr, ai] = await Promise.all([
      pingDatabase(),
      pingOcr(),
      pingAi(),
    ]);

    const services = { database, ocr, ai, gemini: ai };

    return {
      status: aggregateStatus(services),
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      pipelineMock: env.useMockPipeline,
      services,
    };
  }
}

export const healthService = new HealthService();
