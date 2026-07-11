import { describe, expect, it } from 'vitest';
import { enrichQuantitiesFromOcr } from './enrichQuantitiesFromOcr';

const SAMPLE_OCR = `
1 Camarones 400
5 Cerveza tecate 500
1 Flan de chocolate 100
`;

describe('enrichQuantitiesFromOcr', () => {
  it('fixes quantity when AI returns qty=1 with line total', () => {
    const enriched = enrichQuantitiesFromOcr(
      [{ name: 'Cerveza tecate', unitPrice: 500, quantity: 1 }],
      SAMPLE_OCR,
    );
    expect(enriched[0]).toMatchObject({ quantity: 5, unitPrice: 500 });
  });

  it('leaves single-quantity items unchanged', () => {
    const enriched = enrichQuantitiesFromOcr(
      [{ name: 'Camarones', unitPrice: 400, quantity: 1 }],
      SAMPLE_OCR,
    );
    expect(enriched[0]).toMatchObject({ quantity: 1, unitPrice: 400 });
  });

  it('does not modify indivisible promos', () => {
    const enriched = enrichQuantitiesFromOcr(
      [{ name: 'Combo Familiar', unitPrice: 980, quantity: 1, indivisible: true }],
      '2 Combo Familiar 980',
    );
    expect(enriched[0]).toMatchObject({ quantity: 1, indivisible: true });
  });
});
