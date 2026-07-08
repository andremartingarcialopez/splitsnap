import { describe, expect, it } from 'vitest';
import { createProductSchema, updateProductSchema } from './product.validator';

describe('createProductSchema', () => {
  it('requires ticketId, name and positive price', () => {
    const result = createProductSchema.parse({
      ticketId: '11111111-1111-1111-1111-111111111111',
      name: 'Tacos',
      unitPrice: 80,
    });
    expect(result.name).toBe('Tacos');
  });

  it('rejects zero price', () => {
    expect(() =>
      createProductSchema.parse({
        ticketId: '11111111-1111-1111-1111-111111111111',
        name: 'X',
        unitPrice: 0,
      }),
    ).toThrow();
  });
});

describe('updateProductSchema', () => {
  it('requires at least one field', () => {
    expect(() => updateProductSchema.parse({})).toThrow();
  });
});
