import { describe, expect, it } from 'vitest';
import { normalizeParsedItems } from './productNormalizer';

describe('normalizeParsedItems', () => {
  it('explodes quantity lines into individual unit products', () => {
    const lines = normalizeParsedItems([
      { name: '3 Cervezas', unitPrice: 300, confidenceScore: 90 },
    ]);
    expect(lines).toHaveLength(3);
    expect(lines.every((l) => l.unitPrice === 100)).toBe(true);
    expect(lines.every((l) => l.name === 'Cervezas')).toBe(true);
    expect(new Set(lines.map((l) => l.lineGroupId)).size).toBe(1);
  });

  it('keeps indivisible combos as a single line', () => {
    const lines = normalizeParsedItems([
      {
        name: 'Combo Familiar',
        unitPrice: 980,
        quantity: 1,
        indivisible: true,
        confidenceScore: 80,
      },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.unitPrice).toBe(980);
    expect(lines[0]?.isIndivisible).toBe(true);
  });

  it('parses leading quantity from name when quantity omitted', () => {
    const lines = normalizeParsedItems([
      { name: '2 Agua Natural', unitPrice: 80, confidenceScore: 70 },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]?.unitPrice).toBe(40);
  });
});
