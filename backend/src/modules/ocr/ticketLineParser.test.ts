import { describe, expect, it } from 'vitest';
import { parseTicketLine, parseTicketLinesFromOcr } from './ticketLineParser';

describe('parseTicketLine', () => {
  it('parses CANT | producto | importe', () => {
    expect(parseTicketLine('5 Cerveza tecate 500')).toEqual({
      quantity: 5,
      name: 'Cerveza tecate',
      lineTotal: 500,
      rawLine: '5 Cerveza tecate 500',
    });
  });

  it('parses single quantity lines', () => {
    expect(parseTicketLine('1 Camarones 400.00')).toMatchObject({
      quantity: 1,
      name: 'Camarones',
      lineTotal: 400,
    });
  });

  it('ignores header rows', () => {
    expect(parseTicketLine('CANT DESCRIPCION IMPORTE')).toBeNull();
    expect(parseTicketLine('SUBTOTAL 1000')).toBeNull();
  });
});

describe('parseTicketLinesFromOcr', () => {
  it('extracts multiple product lines from ticket text', () => {
    const ocr = `
RESTAURANTE EL SOL
CANT DESCRIPCION IMPORTE
1 Camarones 400
5 Cerveza tecate 500
1 Flan de chocolate 100
SUBTOTAL 1000
`;
    const lines = parseTicketLinesFromOcr(ocr);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatchObject({ quantity: 5, lineTotal: 500 });
  });
});
