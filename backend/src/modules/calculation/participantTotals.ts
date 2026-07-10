import type { Prisma } from '@prisma/client';

/** Totales por participante (MDD §5.1), sin persistir. */
export type ParticipantTotalsRow = {
  ticketParticipantId: string;
  participantId: string;
  subtotal: number;
  taxPortion: number;
  discountPortion: number;
  subtotalWithTax: number;
  tipPercentage: number;
  tip: number;
  total: number;
};

export type TicketForParticipantTotals = {
  tax?: number | null | Prisma.Decimal;
  discount?: number | null | Prisma.Decimal;
  tipMode: string;
  globalTipPercentage?: number | null | Prisma.Decimal;
  products: Array<{
    unitPrice: number | Prisma.Decimal;
    assignments: Array<{
      participantId: string;
      shareRatio: number | Prisma.Decimal;
    }>;
  }>;
  ticketParticipants: Array<{
    id: string;
    participantId: string;
    individualTipPercentage?: number | null | Prisma.Decimal;
  }>;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function asNumber(value: number | Prisma.Decimal | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

/** Reparto proporcional de productos, IVA, descuento y propina por participante. */
export function computeParticipantTotals(
  ticket: TicketForParticipantTotals,
): ParticipantTotalsRow[] {
  const subtotals = new Map<string, number>();

  for (const tp of ticket.ticketParticipants) {
    subtotals.set(tp.participantId, 0);
  }

  for (const product of ticket.products) {
    if (!product.assignments.length) continue;

    const shareSum = product.assignments.reduce(
      (acc, assignment) => acc + asNumber(assignment.shareRatio),
      0,
    );
    if (shareSum <= 0) continue;

    const unitPrice = asNumber(product.unitPrice);
    for (const assignment of product.assignments) {
      const portion = unitPrice * (asNumber(assignment.shareRatio) / shareSum);
      const current = subtotals.get(assignment.participantId) ?? 0;
      subtotals.set(assignment.participantId, current + portion);
    }
  }

  const ticketSubtotal = round2(
    [...subtotals.values()].reduce((acc, value) => acc + value, 0),
  );
  const tax = asNumber(ticket.tax);
  const discount = asNumber(ticket.discount);
  const globalTip = asNumber(ticket.globalTipPercentage);

  return ticket.ticketParticipants.map((tp) => {
    const subtotal = round2(subtotals.get(tp.participantId) ?? 0);
    const taxPortion =
      ticketSubtotal > 0 ? round2((subtotal / ticketSubtotal) * tax) : 0;
    const discountPortion =
      ticketSubtotal > 0 ? round2((subtotal / ticketSubtotal) * discount) : 0;
    const subtotalWithTax = round2(subtotal + taxPortion - discountPortion);

    let tipPercentage = globalTip;
    if (ticket.tipMode === 'INDIVIDUAL') {
      tipPercentage =
        tp.individualTipPercentage != null
          ? asNumber(tp.individualTipPercentage)
          : globalTip;
    }

    const tip = round2(subtotalWithTax * (tipPercentage / 100));
    const total = round2(subtotalWithTax + tip);

    return {
      ticketParticipantId: tp.id,
      participantId: tp.participantId,
      subtotal,
      taxPortion,
      discountPortion,
      subtotalWithTax,
      tipPercentage,
      tip,
      total,
    };
  });
}

/** Monto asignado de un producto a un participante (respeta shareRatio). */
export function participantProductPortion(
  unitPrice: number,
  assignments: Array<{ participantId: string; shareRatio: number | Prisma.Decimal }>,
  participantId: string,
): number | null {
  const assignment = assignments.find((row) => row.participantId === participantId);
  if (!assignment || assignments.length === 0) return null;

  const shareSum = assignments.reduce(
    (acc, row) => acc + asNumber(row.shareRatio),
    0,
  );
  if (shareSum <= 0) return null;

  return round2(unitPrice * (asNumber(assignment.shareRatio) / shareSum));
}
