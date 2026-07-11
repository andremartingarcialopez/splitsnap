import { describe, expect, it } from 'vitest';
import { normalizeParsedItems, normalizeParsedTicket } from './productNormalizer';

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

  it('explodes 5 cervezas tecate into unit lines', () => {
    const lines = normalizeParsedItems([
      { name: 'Cerveza tecate', unitPrice: 500, quantity: 5 },
    ]);
    expect(lines).toHaveLength(5);
    expect(lines.every((l) => l.unitPrice === 100)).toBe(true);
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

describe('normalizeParsedTicket with ocrText', () => {
  const ocr = `
1 Camarones 400
5 Cerveza tecate 500
1 Flan de chocolate 100
`;

  it('enriches from OCR and explodes grouped lines', () => {
    const result = normalizeParsedTicket(
      {
        restaurantName: 'Test',
        items: [
          { name: 'Camarones', unitPrice: 400, quantity: 1 },
          { name: 'Cerveza tecate', unitPrice: 500, quantity: 1 },
          { name: 'Flan de chocolate', unitPrice: 100, quantity: 1 },
        ],
        subtotal: 1000,
        tax: null,
        discount: 0,
        total: 1000,
      },
      { ocrText: ocr },
    );

    expect(result.normalizedProducts).toHaveLength(7);
    const cervezas = result.normalizedProducts.filter((p) =>
      p.name.toLowerCase().includes('cerveza'),
    );
    expect(cervezas).toHaveLength(5);
    expect(cervezas.every((p) => p.unitPrice === 100)).toBe(true);
  });
});
