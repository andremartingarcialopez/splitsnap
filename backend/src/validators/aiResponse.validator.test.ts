import { describe, expect, it } from 'vitest';
import { parsedTicketSchema } from './aiResponse.validator';

describe('aiResponse.validator', () => {
  it('rejects items with non-positive unitPrice', () => {
    const result = parsedTicketSchema.safeParse({
      items: [{ name: 'Taco', unitPrice: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid AI ticket JSON', () => {
    const result = parsedTicketSchema.safeParse({
      restaurantName: 'Demo',
      items: [{ name: 'Taco', unitPrice: 50 }],
      subtotal: 50,
      total: 58,
    });
    expect(result.success).toBe(true);
  });
});
