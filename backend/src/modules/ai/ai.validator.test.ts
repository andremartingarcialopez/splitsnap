import { describe, expect, it } from 'vitest';
import { auditParsedTicket, normalizeProductNameKey, sumLineTotals } from './ai.validator';
import { AppError } from '../../utils/AppError';

describe('auditParsedTicket', () => {
  it('accepts valid ticket aligned to MDD example', () => {
    const result = auditParsedTicket({
      restaurantName: 'Pizza House',
      items: [
        { name: 'Pizza Pepperoni', unitPrice: 320, confidenceScore: 92 },
        { name: 'Refresco', unitPrice: 45 },
      ],
      subtotal: 365,
      tax: 58.4,
      discount: 0,
      total: 423.4,
    });
    expect(result.items).toHaveLength(2);
  });

  it('rejects unitPrice <= 0', () => {
    expect(() =>
      auditParsedTicket({
        restaurantName: 'X',
        items: [{ name: 'Bad', unitPrice: 0 }],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      }),
    ).toThrow(AppError);
  });

  it('preserves optional metadata from Gemini', () => {
    const result = auditParsedTicket({
      restaurantName: 'El Sol',
      items: [{ name: 'Taco', unitPrice: 105, quantity: 1 }],
      subtotal: 105,
      tax: null,
      discount: 0,
      total: 105,
      warnings: ['Precio parcialmente ilegible'],
      confidence: 88,
    });
    expect(result.warnings).toContain('Precio parcialmente ilegible');
    expect(result.confidence).toBe(88);
  });

  it('warns on duplicate normalized names', () => {
    const result = auditParsedTicket({
      restaurantName: 'Test',
      items: [
        { name: 'Cerveza', unitPrice: 60 },
        { name: 'CERVEZA', unitPrice: 60 },
      ],
      subtotal: 120,
      tax: null,
      discount: 0,
      total: 120,
    });
    expect(result.warnings?.some((w) => w.includes('duplicado'))).toBe(true);
  });
});

describe('normalizeProductNameKey', () => {
  it('treats case variants as the same key', () => {
    expect(normalizeProductNameKey('Coca-Cola')).toBe(normalizeProductNameKey('coca cola'));
  });
});

describe('sumLineTotals', () => {
  it('sums line totals', () => {
    expect(sumLineTotals([{ unitPrice: 300 }, { unitPrice: 50 }])).toBe(350);
  });
});
