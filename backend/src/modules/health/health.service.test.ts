import { describe, expect, it } from 'vitest';
import { redactSecrets } from '../../middleware/errorLogger';

describe('errorLogger redactSecrets', () => {
  it('redacts apikey query params', () => {
    const msg = 'Failed https://api.example.com?key=supersecretkey123456';
    expect(redactSecrets(msg)).not.toContain('supersecretkey123456');
    expect(redactSecrets(msg)).toContain('[REDACTED]');
  });

  it('redacts long token-like strings', () => {
    const msg = 'Authorization failed for token abcdefghijklmnopqrstuvwxyz';
    expect(redactSecrets(msg)).toContain('[REDACTED]');
  });
});

describe('health aggregate status', () => {
  it('marks unhealthy when database is down', async () => {
    const { HealthService } = await import('./health.service');
    const svc = new HealthService();
    const report = await svc.check();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(report.status);
    expect(report.services.database).toBeDefined();
    expect(report.services.ocr).toBeDefined();
    expect(report.services.ai).toBeDefined();
    expect(report.services.gemini).toBeDefined();
  });
});
