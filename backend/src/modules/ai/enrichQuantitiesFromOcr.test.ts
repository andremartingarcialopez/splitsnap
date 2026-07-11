import { describe, expect, it } from 'vitest';
import { enrichQuantitiesFromOcr } from './enrichQuantitiesFromOcr';
import { normalizeParsedTicket } from './productNormalizer';

const SAMPLE_OCR = `
1 Camarones 400
5 Cerveza tecate 500
1 Flan de chocolate 100
`;

const EL_SOL_OCR = `
EL SOL DE MÉXICO
CANT. DESCRIPCIÓN TOTAL
2 TACOS AL PASTOR (4pz) $180.00
1 QUESADILLA DE HUITLACOCHE $110.00
1 CHICHARRÓN DE QUESO $95.00
2 CERVEZA PACÍFICO $130.00
1 FLAN CASERO (Pza) $80.00
SUB-TOTAL ITEMS $595.00
`;

const EL_SOL_AI_ITEMS = [
  { name: 'Cerveza Pacífico', unitPrice: 130, quantity: 1 },
  { name: 'Chicharrón de Queso', unitPrice: 95, quantity: 1 },
  { name: 'Flan Casero', unitPrice: 80, quantity: 1 },
  { name: 'Quesadilla de Huitlacoche', unitPrice: 110, quantity: 1 },
  { name: 'Tacos al Pastor (4pz)', unitPrice: 180, quantity: 1 },
];

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

  it('does not modify indivisible promos without OCR qty match', () => {
    const enriched = enrichQuantitiesFromOcr(
      [{ name: 'Combo Familiar', unitPrice: 980, quantity: 1, indivisible: true }],
      '1 Combo Familiar 980',
    );
    expect(enriched[0]).toMatchObject({ quantity: 1, indivisible: true });
  });

  it('overrides indivisible when OCR shows qty>1 for same product', () => {
    const enriched = enrichQuantitiesFromOcr(
      [{ name: 'Tacos al Pastor (4pz)', unitPrice: 180, quantity: 1, indivisible: true }],
      EL_SOL_OCR,
    );
    expect(enriched[0]).toMatchObject({ quantity: 2, unitPrice: 180, indivisible: false });
  });

  it('enriches El Sol ticket when AI returns qty=1 for all items', () => {
    const enriched = enrichQuantitiesFromOcr(EL_SOL_AI_ITEMS, EL_SOL_OCR);
    expect(enriched.find((i) => i.name.includes('Cerveza'))).toMatchObject({
      quantity: 2,
      unitPrice: 130,
    });
    expect(enriched.find((i) => i.name.includes('Tacos'))).toMatchObject({
      quantity: 2,
      unitPrice: 180,
    });
  });

  it('enriches from split OCR columns', () => {
    const splitOcr = `
2
CERVEZA PACÍFICO
130.00
`;
    const enriched = enrichQuantitiesFromOcr(
      [{ name: 'Cerveza Pacífico', unitPrice: 130, quantity: 1 }],
      splitOcr,
    );
    expect(enriched[0]).toMatchObject({ quantity: 2, unitPrice: 130 });
  });
});

describe('normalizeParsedTicket El Sol integration', () => {
  it('explodes grouped lines into 7 unit products', () => {
    const result = normalizeParsedTicket(
      {
        restaurantName: 'El Sol de México',
        items: EL_SOL_AI_ITEMS,
        subtotal: 595,
        tax: 95.2,
        discount: 0,
        total: 690.2,
      },
      { ocrText: EL_SOL_OCR },
    );

    expect(result.normalizedProducts).toHaveLength(7);

    const cervezas = result.normalizedProducts.filter((p) =>
      p.name.toLowerCase().includes('cerveza'),
    );
    expect(cervezas).toHaveLength(2);
    expect(cervezas.every((p) => p.unitPrice === 65)).toBe(true);

    const tacos = result.normalizedProducts.filter((p) =>
      p.name.toLowerCase().includes('tacos'),
    );
    expect(tacos).toHaveLength(2);
    expect(tacos.every((p) => p.unitPrice === 90)).toBe(true);
  });

  it('explodes from split OCR columns end-to-end', () => {
    const splitOcr = `
2
CERVEZA PACÍFICO
130.00
1
FLAN CASERO
80.00
`;
    const result = normalizeParsedTicket(
      {
        restaurantName: 'Test',
        items: [
          { name: 'Cerveza Pacífico', unitPrice: 130, quantity: 1 },
          { name: 'Flan Casero', unitPrice: 80, quantity: 1 },
        ],
        subtotal: 210,
        tax: null,
        discount: 0,
        total: 210,
      },
      { ocrText: splitOcr },
    );

    expect(result.normalizedProducts).toHaveLength(3);
    expect(result.normalizedProducts.filter((p) => p.name.includes('Cerveza'))).toHaveLength(2);
  });
});
