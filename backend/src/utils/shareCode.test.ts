import { describe, expect, it } from 'vitest';
import { generateShareCode } from './shareCode';

describe('generateShareCode', () => {
  it('generates uppercase alphanumeric codes of requested length', () => {
    const code = generateShareCode(8);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
});
