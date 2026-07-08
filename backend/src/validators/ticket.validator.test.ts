import { describe, expect, it } from 'vitest';
import { createTicketSchema, addTicketParticipantSchema } from './ticket.validator';

describe('createTicketSchema', () => {
  it('accepts minimal ticket', () => {
    const result = createTicketSchema.parse({ title: 'Cena' });
    expect(result.title).toBe('Cena');
    expect(result.tipMode).toBe('GLOBAL');
    expect(result.products).toEqual([]);
  });

  it('rejects invalid tipMode', () => {
    expect(() =>
      createTicketSchema.parse({ title: 'X', tipMode: 'OTHER' }),
    ).toThrow();
  });

  it('rejects product with non-positive price', () => {
    expect(() =>
      createTicketSchema.parse({
        title: 'X',
        products: [{ name: 'A', unitPrice: 0 }],
      }),
    ).toThrow();
  });
});

describe('addTicketParticipantSchema', () => {
  it('requires uuid participantId', () => {
    expect(() => addTicketParticipantSchema.parse({ participantId: 'x' })).toThrow();
  });
});
