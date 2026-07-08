import { describe, expect, it } from 'vitest';
import { auditParsedTicket } from './ai.validator';
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
    expect(result.restaurantName).toBe('Pizza House');
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

  it('rejects empty items', () => {
    expect(() =>
      auditParsedTicket({
        restaurantName: 'X',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      }),
    ).toThrow(AppError);
  });
});
