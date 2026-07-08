import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';

export type ParticipantSummary = {
  participantId: string;
  name: string | null;
  subtotal: number;
  taxPortion: number;
  discountPortion: number;
  subtotalWithTax: number;
  tip: number;
  total: number;
  tipPercentage: number;
};

export type TicketSummary = {
  participants: ParticipantSummary[];
  grandTotal: number;
  ticketSubtotal: number;
  ticketTax: number;
  ticketDiscount: number;
  ticketTotal: number;
  tipMode: string;
  globalTipPercentage: number | null;
  canFinalize: boolean;
  unassignedProducts: Array<{ id: string; name: string }>;
  varianceWarning: boolean;
  varianceAmount: number | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * CalculationService — MDD §5.1 Template Method.
 * No persiste totales derivados; calcula en runtime.
 */
export class CalculationService {
  async summarize(ticketId: string): Promise<TicketSummary> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        products: {
          include: {
            assignments: {
              include: { participant: true },
            },
          },
        },
        ticketParticipants: {
          include: { participant: true },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }

    const unassignedProducts = ticket.products
      .filter((p) => p.assignments.length === 0)
      .map((p) => ({ id: p.id, name: p.name }));

    const subtotals = new Map<string, number>();
    const names = new Map<string, string | null>();

    for (const tp of ticket.ticketParticipants) {
      subtotals.set(tp.participantId, 0);
      names.set(tp.participantId, tp.participant.name);
    }

    for (const product of ticket.products) {
      if (!product.assignments.length) continue;

      const shareSum = product.assignments.reduce(
        (acc, a) => acc + Number(a.shareRatio),
        0,
      );
      const unitPrice = Number(product.unitPrice);

      for (const assignment of product.assignments) {
        const portion = unitPrice * (Number(assignment.shareRatio) / shareSum);
        const current = subtotals.get(assignment.participantId) ?? 0;
        subtotals.set(assignment.participantId, current + portion);
        names.set(assignment.participantId, assignment.participant.name);
      }
    }

    const ticketSubtotal = round2(
      [...subtotals.values()].reduce((a, b) => a + b, 0),
    );
    const tax = Number(ticket.tax ?? 0);
    const discount = Number(ticket.discount ?? 0);
    const globalTip = ticket.globalTipPercentage != null
      ? Number(ticket.globalTipPercentage)
      : 0;

    const participants: ParticipantSummary[] = [];

    for (const tp of ticket.ticketParticipants) {
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
            ? Number(tp.individualTipPercentage)
            : globalTip;
      }

      const tip = round2(subtotalWithTax * (tipPercentage / 100));
      const total = round2(subtotalWithTax + tip);

      participants.push({
        participantId: tp.participantId,
        name: names.get(tp.participantId) ?? tp.participant.name,
        subtotal,
        taxPortion,
        discountPortion,
        subtotalWithTax,
        tip,
        total,
        tipPercentage,
      });
    }

    const grandTotal = round2(participants.reduce((a, p) => a + p.total, 0));
    const ticketTotal = Number(ticket.total ?? 0);
    const varianceAmount =
      ticketTotal > 0 ? round2(Math.abs(grandTotal - ticketTotal)) : null;
    const varianceWarning =
      varianceAmount != null &&
      ticketTotal > 0 &&
      varianceAmount / ticketTotal > env.CALC_TOTAL_VARIANCE_THRESHOLD;

    const canFinalize =
      ticket.ticketParticipants.length >= 1 &&
      ticket.products.length >= 1 &&
      unassignedProducts.length === 0 &&
      ticketSubtotal > 0;

    return {
      participants,
      grandTotal,
      ticketSubtotal,
      ticketTax: tax,
      ticketDiscount: discount,
      ticketTotal,
      tipMode: ticket.tipMode,
      globalTipPercentage: ticket.globalTipPercentage != null
        ? Number(ticket.globalTipPercentage)
        : null,
      canFinalize,
      unassignedProducts,
      varianceWarning,
      varianceAmount,
    };
  }
}

export const calculationService = new CalculationService();
