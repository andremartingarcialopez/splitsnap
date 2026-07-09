import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function decimal(n: number | null | undefined): Prisma.Decimal | null {
  if (n == null || Number.isNaN(n)) return null;
  return new Prisma.Decimal(n.toFixed(2));
}

function decimalRate(n: number | null | undefined): Prisma.Decimal | null {
  if (n == null || Number.isNaN(n)) return null;
  return new Prisma.Decimal(n.toFixed(6));
}

/**
 * Tasa de impuesto efectiva al escanear: tax explícito o diferencia total − productos.
 */
export function computeScanTaxRate(
  productsSubtotal: number,
  tax: number | null | undefined,
  discount: number,
  printedTotal: number | null | undefined,
): number | null {
  if (productsSubtotal <= 0) return null;

  let taxAmount = tax ?? 0;
  if (taxAmount <= 0 && printedTotal != null) {
    const implied = roundMoney(printedTotal - productsSubtotal - discount);
    if (implied > 0) taxAmount = implied;
  }

  if (taxAmount <= 0) return null;
  return Math.round((taxAmount / productsSubtotal) * 1_000_000) / 1_000_000;
}

export function deriveTotalsFromProducts(
  productsSubtotal: number,
  scanTaxRate: number | null,
  fallbackTax: number,
  discount: number,
): { subtotal: number; tax: number; total: number } {
  const subtotal = roundMoney(productsSubtotal);
  const tax =
    scanTaxRate != null && scanTaxRate > 0
      ? roundMoney(subtotal * scanTaxRate)
      : roundMoney(fallbackTax);
  const total = roundMoney(subtotal + tax - discount);
  return { subtotal, tax, total };
}

type TicketTotalsSnapshot = {
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  printedTotal: number | null;
  scanTaxRate: number | null;
};

export function buildInitialTicketTotals(
  productsSubtotal: number,
  input: {
    tax?: number | null;
    discount?: number | null;
    total?: number | null;
    printedTotal?: number | null;
  },
): TicketTotalsSnapshot {
  const discount = input.discount ?? 0;
  const printedTotal = input.printedTotal ?? input.total ?? productsSubtotal;
  const scanTaxRate = computeScanTaxRate(
    productsSubtotal,
    input.tax,
    discount,
    printedTotal,
  );
  const totals = deriveTotalsFromProducts(
    productsSubtotal,
    scanTaxRate,
    input.tax ?? 0,
    discount,
  );

  return {
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount,
    total: totals.total,
    printedTotal: printedTotal != null ? roundMoney(printedTotal) : null,
    scanTaxRate,
  };
}

/**
 * Recalcula subtotal, tax y total a partir de la suma de productos.
 * El impuesto escala según scanTaxRate (fijado al escanear) o proporcionalmente en tickets legacy.
 */
export async function syncTicketTotalsFromProducts(
  ticketId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  const ticket = await client.ticket.findUnique({
    where: { id: ticketId },
    include: { products: true },
  });
  if (!ticket) return;

  const productsSum = roundMoney(
    ticket.products.reduce((acc, product) => acc + Number(product.unitPrice), 0),
  );
  const discount = Number(ticket.discount ?? 0);
  const scanTaxRate =
    ticket.scanTaxRate != null ? Number(ticket.scanTaxRate) : null;
  const storedSubtotal = ticket.subtotal != null ? Number(ticket.subtotal) : 0;
  const storedTax = Number(ticket.tax ?? 0);

  let tax: number;
  if (scanTaxRate != null && scanTaxRate > 0) {
    tax = roundMoney(productsSum * scanTaxRate);
  } else if (storedSubtotal > 0 && storedTax > 0) {
    tax = roundMoney(storedTax * (productsSum / storedSubtotal));
  } else {
    tax = 0;
  }

  const subtotal = productsSum;
  const total = roundMoney(subtotal + tax - discount);

  await client.ticket.update({
    where: { id: ticketId },
    data: {
      subtotal: decimal(subtotal),
      tax: decimal(tax),
      total: decimal(total),
    },
  });
}

export function ticketTotalsToPrismaData(snapshot: TicketTotalsSnapshot) {
  return {
    subtotal: decimal(snapshot.subtotal),
    tax: decimal(snapshot.tax),
    discount: decimal(snapshot.discount ?? 0),
    total: decimal(snapshot.total),
    printedTotal: decimal(snapshot.printedTotal),
    scanTaxRate: decimalRate(snapshot.scanTaxRate),
  };
}
