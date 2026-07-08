import { describe, expect, it } from 'vitest';

/** Pure helpers mirroring CalculationService math (MDD §5.1). */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function sharedPortion(unitPrice: number, shareRatio: number, shareSum: number) {
  return unitPrice * (shareRatio / shareSum);
}

describe('calculation math MDD §5.1', () => {
  it('splits shared product equitably (shareRatio 1 each)', () => {
    const portion = sharedPortion(300, 1, 3);
    expect(round2(portion)).toBe(100);
  });

  it('applies proportional tax', () => {
    const subtotal = 250;
    const ticketSubtotal = 500;
    const tax = 80;
    const taxPortion = round2((subtotal / ticketSubtotal) * tax);
    expect(taxPortion).toBe(40);
  });

  it('computes tip on subtotal with tax', () => {
    const subtotalWithTax = 290;
    const tip = round2(subtotalWithTax * 0.1);
    expect(tip).toBe(29);
  });
});
