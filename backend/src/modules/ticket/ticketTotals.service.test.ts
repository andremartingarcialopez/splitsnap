import { describe, expect, it } from 'vitest';
import {
  buildInitialTicketTotals,
  computeScanTaxRate,
  deriveTotalsFromProducts,
  roundMoney,
} from './ticketTotals.service';

describe('ticketTotals.service', () => {
  it('infers tax rate from printed total when tax is missing (La Mar Salada)', () => {
    const productsSum = 60.5;
    const printedTotal = 65;
    const rate = computeScanTaxRate(productsSum, null, 0, printedTotal);
    expect(rate).toBeCloseTo(4.5 / 60.5, 4);

    const totals = deriveTotalsFromProducts(160.5, rate, 0, 0);
    expect(totals.subtotal).toBe(160.5);
    expect(totals.tax).toBe(roundMoney(160.5 * (4.5 / 60.5)));
    expect(totals.total).toBe(roundMoney(160.5 + totals.tax));
  });

  it('uses explicit tax from scan when present', () => {
    const rate = computeScanTaxRate(100, 16, 0, 116);
    expect(rate).toBe(0.16);
    const totals = deriveTotalsFromProducts(200, rate, 16, 0);
    expect(totals.tax).toBe(32);
    expect(totals.total).toBe(232);
  });

  it('buildInitialTicketTotals sets printedTotal and scanTaxRate', () => {
    const snapshot = buildInitialTicketTotals(60.5, {
      tax: null,
      discount: 0,
      total: 65,
    });
    expect(snapshot.printedTotal).toBe(65);
    expect(snapshot.scanTaxRate).toBeCloseTo(4.5 / 60.5, 4);
    expect(snapshot.total).toBe(65);
  });

  it('returns zero tax when no rate and no fallback', () => {
    const totals = deriveTotalsFromProducts(50, null, 0, 0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(50);
  });
});
