import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker } from './circuitBreaker';

describe('CircuitBreaker', () => {
  it('opens after 3 failures', async () => {
    const breaker = new CircuitBreaker({
      name: 'test',
      failureThreshold: 3,
      windowMs: 30_000,
      openMs: 60_000,
    });

    const fail = vi.fn(async () => {
      throw new Error('boom');
    });

    for (let i = 0; i < 3; i++) {
      await expect(breaker.exec(fail)).rejects.toThrow('boom');
    }
    expect(breaker.getState()).toBe('OPEN');
    await expect(breaker.exec(fail)).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE_UNAVAILABLE',
    });
  });

  it('resets on success', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 });
    await breaker.exec(async () => 'ok');
    expect(breaker.getState()).toBe('CLOSED');
  });
});
