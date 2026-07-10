import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import {
  PARTICIPANT_SESSION_STATUS,
  PAYMENT_STATUS,
} from '../collaboration/collaboration.types';
import { computeParticipantTotals } from './participantTotals';

export type ParticipantSummary = {
  ticketParticipantId: string;
  participantId: string;
  name: string | null;
  subtotal: number;
  taxPortion: number;
  discountPortion: number;
  subtotalWithTax: number;
  tip: number;
  total: number;
  tipPercentage: number;
  paymentStatus: string;
  sessionStatus: string;
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
  allParticipantsCompleted: boolean;
  allParticipantsPaid: boolean;
  canClose: boolean;
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

    const names = new Map<string, string | null>();
    for (const tp of ticket.ticketParticipants) {
      names.set(tp.participantId, tp.displayName ?? tp.participant.name);
    }
    for (const product of ticket.products) {
      for (const assignment of product.assignments) {
        names.set(assignment.participantId, assignment.participant.name);
      }
    }

    const computed = computeParticipantTotals(ticket);
    const ticketSubtotal = round2(computed.reduce((acc, row) => acc + row.subtotal, 0));
    const tax = Number(ticket.tax ?? 0);
    const discount = Number(ticket.discount ?? 0);
    const globalTip = ticket.globalTipPercentage != null
      ? Number(ticket.globalTipPercentage)
      : 0;

    const participants: ParticipantSummary[] = computed.map((row) => {
      const tp = ticket.ticketParticipants.find((item) => item.id === row.ticketParticipantId);
      if (!tp) {
        throw new AppError('Participant not found in ticket', 'INTERNAL_ERROR', 500);
      }

      return {
        ticketParticipantId: row.ticketParticipantId,
        participantId: row.participantId,
        name: names.get(row.participantId) ?? tp.participant.name,
        subtotal: row.subtotal,
        taxPortion: row.taxPortion,
        discountPortion: row.discountPortion,
        subtotalWithTax: row.subtotalWithTax,
        tip: row.tip,
        total: row.total,
        tipPercentage: row.tipPercentage,
        paymentStatus: tp.paymentStatus,
        sessionStatus: tp.sessionStatus,
      };
    });

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

    const allParticipantsCompleted =
      ticket.ticketParticipants.length > 0 &&
      ticket.ticketParticipants.every(
        (tp) => tp.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED,
      );

    const allParticipantsPaid =
      ticket.ticketParticipants.length > 0 &&
      ticket.ticketParticipants.every((tp) => tp.paymentStatus === PAYMENT_STATUS.PAID);

    const isCollaborative = Boolean(ticket.shareCode);
    const canClose = isCollaborative
      ? canFinalize && allParticipantsCompleted && allParticipantsPaid
      : canFinalize;

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
      allParticipantsCompleted,
      allParticipantsPaid,
      canClose,
      unassignedProducts,
      varianceWarning,
      varianceAmount,
    };
  }
}

export const calculationService = new CalculationService();
