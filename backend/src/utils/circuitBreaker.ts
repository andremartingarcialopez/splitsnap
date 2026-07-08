export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type CircuitBreakerOptions = {
  failureThreshold?: number;
  windowMs?: number;
  openMs?: number;
  name?: string;
};

/**
 * Circuit Breaker MDD §5.3 / Blueprint §4.2
 * - 3 fallos consecutivos en ventana 30s → OPEN 60s
 * - HALF_OPEN permite un intento de prueba
 */
export class CircuitBreaker {
  private failures: number[] = [];
  private state: CircuitState = 'CLOSED';
  private openedAt = 0;
  private readonly failureThreshold: number;
  private readonly windowMs: number;
  private readonly openMs: number;
  private readonly name: string;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 3;
    this.windowMs = opts.windowMs ?? 30_000;
    this.openMs = opts.openMs ?? 60_000;
    this.name = opts.name ?? 'circuit';
  }

  getState(): CircuitState {
    this.refresh();
    return this.state;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    this.refresh();
    if (this.state === 'OPEN') {
      const err = new Error(
        `Circuit breaker OPEN for ${this.name}; try again later or use manual entry`,
      );
      (err as Error & { code: string }).code = 'EXTERNAL_SERVICE_UNAVAILABLE';
      throw err;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private refresh() {
    const now = Date.now();
    this.failures = this.failures.filter((t) => now - t <= this.windowMs);

    if (this.state === 'OPEN' && now - this.openedAt >= this.openMs) {
      this.state = 'HALF_OPEN';
    }
  }

  private onSuccess() {
    this.failures = [];
    this.state = 'CLOSED';
  }

  private onFailure() {
    const now = Date.now();
    this.failures.push(now);
    this.failures = this.failures.filter((t) => now - t <= this.windowMs);

    if (
      this.state === 'HALF_OPEN' ||
      this.failures.length >= this.failureThreshold
    ) {
      this.state = 'OPEN';
      this.openedAt = now;
    }
  }
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  opts: {
    retries?: number;
    shouldRetry?: (err: unknown) => boolean;
    delaysMs?: number[];
  } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const delays = opts.delaysMs ?? [1000, 2000, 4000];
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !shouldRetry(err)) throw err;
      const delay = delays[Math.min(attempt, delays.length - 1)];
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
