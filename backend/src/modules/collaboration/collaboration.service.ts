import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { generateShareCode } from '../../utils/shareCode';
import type {
  AdminSetupInput,
  CollaborationSettingsInput,
  PublicJoinInput,
  StartDivisionInput,
} from '../../validators/collaboration.validator';
import {
  PARTICIPANT_SESSION_STATUS,
  PAYMENT_STATUS,
  TICKET_SESSION_STATUS,
  type PaymentStatus,
} from './collaboration.types';
import { assignmentService } from '../assignment/assignment.service';
import {
  emitTicketUpdated,
  type CollaborationRealtimeEvent,
} from './collaboration.realtime';
import {
  computeParticipantTotals,
  participantProductPortion,
} from '../calculation/participantTotals';

const ACTIVE_SHARE_STATUSES = new Set<string>([
  TICKET_SESSION_STATUS.WAITING_FOR_PARTICIPANTS,
  TICKET_SESSION_STATUS.IN_PROGRESS,
  TICKET_SESSION_STATUS.REVIEWING,
  TICKET_SESSION_STATUS.REOPENED,
]);

function decimal(n: number | null | undefined): Prisma.Decimal | null {
  if (n == null || Number.isNaN(n)) return null;
  return new Prisma.Decimal(n.toFixed(2));
}

async function uniqueShareCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateShareCode(8);
    const existing = await prisma.ticket.findUnique({
      where: { shareCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new AppError('Could not generate share code', 'INTERNAL_ERROR', 500);
}

const JOINABLE_TICKET_STATUSES = new Set<string>([
  TICKET_SESSION_STATUS.WAITING_FOR_PARTICIPANTS,
  TICKET_SESSION_STATUS.IN_PROGRESS,
  TICKET_SESSION_STATUS.REVIEWING,
  TICKET_SESSION_STATUS.REOPENED,
]);

const ticketPublicInclude = {
  products: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      assignments: {
        include: { participant: true },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
  ticketParticipants: {
    include: { participant: true },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.TicketInclude;

type TicketPublicPayload = Prisma.TicketGetPayload<{ include: typeof ticketPublicInclude }>;

async function loadTicketByShareCode(shareCode: string): Promise<TicketPublicPayload> {
  const ticket = await prisma.ticket.findUnique({
    where: { shareCode },
    include: ticketPublicInclude,
  });
  if (!ticket) {
    throw new AppError('Ticket not found', 'NOT_FOUND', 404);
  }
  return ticket;
}

function assertTicketJoinable(ticket: TicketPublicPayload) {
  if (ticket.finalizedAt) {
    throw new AppError('Ticket is finalized', 'VALIDATION_ERROR', 409);
  }
  if (ticket.sessionStatus === TICKET_SESSION_STATUS.CANCELLED) {
    throw new AppError('Ticket was cancelled', 'VALIDATION_ERROR', 409);
  }
  if (!JOINABLE_TICKET_STATUSES.has(ticket.sessionStatus)) {
    throw new AppError(
      `Ticket is not open for participants (${ticket.sessionStatus})`,
      'VALIDATION_ERROR',
      400,
    );
  }
}

function participantMetaByParticipantId(ticket: TicketPublicPayload) {
  return new Map(
    ticket.ticketParticipants.map((tp) => [
      tp.participantId,
      {
        displayName: tp.displayName ?? tp.participant.name ?? 'Participante',
        avatarId: tp.avatarId,
        isAdmin: tp.isAdmin,
      },
    ]),
  );
}

function serializePublicTicket(ticket: TicketPublicPayload) {
  const meta = participantMetaByParticipantId(ticket);
  const admin = ticket.ticketParticipants.find((tp) => tp.isAdmin);
  const completedCount = ticket.ticketParticipants.filter(
    (tp) => tp.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED,
  ).length;

  return {
    id: ticket.id,
    shareCode: ticket.shareCode,
    title: ticket.title,
    restaurantName: ticket.restaurantName,
    ticketImageUrl: ticket.ticketImageUrl,
    sessionStatus: ticket.sessionStatus,
    processingStatus: ticket.processingStatus,
    subtotal: ticket.subtotal != null ? Number(ticket.subtotal) : null,
    tax: ticket.tax != null ? Number(ticket.tax) : null,
    total: ticket.total != null ? Number(ticket.total) : null,
    globalTipPercentage:
      ticket.globalTipPercentage != null ? Number(ticket.globalTipPercentage) : null,
    expectedParticipantCount: ticket.expectedParticipantCount,
    productCount: ticket.products.length,
    participantCount: ticket.ticketParticipants.length,
    completedParticipantCount: completedCount,
    isFinalized: Boolean(ticket.finalizedAt),
    invitedBy: admin?.displayName ?? admin?.participant.name ?? 'El anfitrión',
    products: ticket.products.map((p) => {
      const assignees = p.assignments.map((a) => {
        const m = meta.get(a.participantId);
        return {
          participantId: a.participantId,
          displayName: m?.displayName ?? a.participant.name ?? 'Participante',
          avatarId: m?.avatarId ?? null,
        };
      });
      return {
        id: p.id,
        name: p.name,
        unitPrice: Number(p.unitPrice),
        emoji: p.emoji,
        isIndivisible: p.isIndivisible,
        assignmentCount: p.assignments.length,
        isShared: p.assignments.length > 1,
        assignees,
      };
    }),
    participants: ticket.ticketParticipants.map((tp) => ({
      id: tp.id,
      displayName: tp.displayName ?? tp.participant.name ?? 'Participante',
      avatarId: tp.avatarId,
      isAdmin: tp.isAdmin,
      sessionStatus: tp.sessionStatus,
      paymentStatus: tp.paymentStatus,
      selectionSubmittedAt: tp.selectionSubmittedAt,
    })),
  };
}

function serializeParticipantSession(
  ticket: TicketPublicPayload,
  ticketParticipantId: string,
) {
  const tp = ticket.ticketParticipants.find((t) => t.id === ticketParticipantId);
  if (!tp) {
    throw new AppError('Participant session not found', 'NOT_FOUND', 404);
  }

  const selectedProductIds = ticket.products
    .filter((p) => p.assignments.some((a) => a.participantId === tp.participantId))
    .map((p) => p.id);

  const selectedProducts = ticket.products
    .filter((p) => selectedProductIds.includes(p.id))
    .map((p) => {
      const amount =
        participantProductPortion(
          Number(p.unitPrice),
          p.assignments,
          tp.participantId,
        ) ?? Number(p.unitPrice);

      return {
        id: p.id,
        name: p.name,
        unitPrice: amount,
        emoji: p.emoji,
      };
    });

  const totals = computeParticipantTotals(ticket).find(
    (row) => row.ticketParticipantId === ticketParticipantId,
  );

  const subtotal = totals?.subtotal ?? 0;
  const taxPortion = totals?.taxPortion ?? 0;
  const discountPortion = totals?.discountPortion ?? 0;
  const tipPercentage = totals?.tipPercentage ?? 0;
  const tip = totals?.tip ?? 0;
  const total = totals?.total ?? 0;

  return {
    ticketParticipantId: tp.id,
    participantId: tp.participantId,
    displayName: tp.displayName ?? tp.participant.name ?? 'Participante',
    avatarId: tp.avatarId,
    sessionStatus: tp.sessionStatus,
    selectionSubmittedAt: tp.selectionSubmittedAt,
    selectedProductIds,
    selectedProducts,
    subtotal,
    taxPortion,
    discountPortion,
    tipPercentage,
    tip,
    total,
    canEdit:
      tp.sessionStatus !== PARTICIPANT_SESSION_STATUS.COMPLETED ||
      ticket.sessionStatus === TICKET_SESSION_STATUS.REOPENED,
  };
}

async function maybePromoteToInProgress(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (ticket?.sessionStatus === TICKET_SESSION_STATUS.WAITING_FOR_PARTICIPANTS) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { sessionStatus: TICKET_SESSION_STATUS.IN_PROGRESS },
    });
  }
}

async function maybePromoteToReviewing(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { expectedParticipantCount: true },
  });
  const participants = await prisma.ticketParticipant.findMany({
    where: { ticketId },
    select: { sessionStatus: true },
  });
  if (participants.length === 0) return;

  const expected = ticket?.expectedParticipantCount;
  if (expected != null && participants.length < expected) return;

  const allDone = participants.every(
    (p) => p.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED,
  );
  if (allDone) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { sessionStatus: TICKET_SESSION_STATUS.REVIEWING },
    });
  }
}

async function markAdminSelectionComplete(ticketId: string) {
  const admin = await prisma.ticketParticipant.findFirst({
    where: { ticketId, isAdmin: true },
  });
  if (!admin || admin.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED) return;

  await prisma.ticketParticipant.update({
    where: { id: admin.id },
    data: {
      sessionStatus: PARTICIPANT_SESSION_STATUS.COMPLETED,
      selectionSubmittedAt: admin.selectionSubmittedAt ?? new Date(),
    },
  });
}

function buildPublicPath(shareCode: string): string {
  return `/ticket/${shareCode}`;
}

const PRE_DIVISION_STATUSES = new Set<string>([
  TICKET_SESSION_STATUS.DRAFT,
  TICKET_SESSION_STATUS.CREATED,
  TICKET_SESSION_STATUS.REOPENED,
]);

const ACTIVE_COLLABORATION_STATUSES = new Set<string>([
  ...PRE_DIVISION_STATUSES,
  TICKET_SESSION_STATUS.WAITING_FOR_PARTICIPANTS,
  TICKET_SESSION_STATUS.IN_PROGRESS,
  TICKET_SESSION_STATUS.REVIEWING,
]);

export class CollaborationService {
  private async broadcastUpdate(shareCode: string, event: CollaborationRealtimeEvent) {
    try {
      const ticket = await this.getPublicByShareCode(shareCode);
      emitTicketUpdated(shareCode, event, ticket);
    } catch (err) {
      console.error('[realtime] broadcast failed', err);
    }
  }

  /** Registra o actualiza al administrador como participante del ticket. */
  async setupAdmin(ticketId: string, input: AdminSetupInput) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (ticket.finalizedAt) {
      throw new AppError('Ticket already finalized', 'VALIDATION_ERROR', 409);
    }
    if (!PRE_DIVISION_STATUSES.has(ticket.sessionStatus)) {
      throw new AppError(
        'Cannot configure admin after division has started',
        'VALIDATION_ERROR',
        400,
      );
    }

    const existingAdmin = await prisma.ticketParticipant.findFirst({
      where: { ticketId, isAdmin: true },
    });

    if (existingAdmin) {
      await prisma.$transaction(async (tx) => {
        await tx.participant.update({
          where: { id: existingAdmin.participantId },
          data: { name: input.displayName },
        });
        await tx.ticketParticipant.update({
          where: { id: existingAdmin.id },
          data: {
            displayName: input.displayName,
            avatarId: input.avatarId ?? existingAdmin.avatarId,
            sessionStatus: PARTICIPANT_SESSION_STATUS.CONNECTED,
          },
        });
      });
      return { adminParticipantId: existingAdmin.participantId };
    }

    const participant = await prisma.participant.create({
      data: { name: input.displayName },
    });

    await prisma.ticketParticipant.create({
      data: {
        ticketId,
        participantId: participant.id,
        isAdmin: true,
        displayName: input.displayName,
        avatarId: input.avatarId ?? null,
        sessionStatus: PARTICIPANT_SESSION_STATUS.CONNECTED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      },
    });

    return { adminParticipantId: participant.id };
  }

  /** Propina global y participantes esperados (antes o durante sesión colaborativa). */
  async updateCollaborationSettings(
    ticketId: string,
    input: CollaborationSettingsInput,
  ) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (ticket.finalizedAt) {
      throw new AppError('Ticket already finalized', 'VALIDATION_ERROR', 409);
    }

    const inPreDivision = PRE_DIVISION_STATUSES.has(ticket.sessionStatus);
    const inActiveCollaboration =
      Boolean(ticket.shareCode) && ACTIVE_COLLABORATION_STATUSES.has(ticket.sessionStatus);

    if (!inPreDivision && !inActiveCollaboration) {
      throw new AppError(
        'Cannot update collaboration settings for this ticket state',
        'VALIDATION_ERROR',
        400,
      );
    }

    if (!inPreDivision && input.expectedParticipantCount !== undefined) {
      throw new AppError(
        'Expected participant count can only be changed before division starts',
        'VALIDATION_ERROR',
        400,
      );
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        tipMode: 'GLOBAL',
        ...(input.globalTipPercentage != null
          ? { globalTipPercentage: decimal(input.globalTipPercentage) }
          : {}),
        ...(inPreDivision && input.expectedParticipantCount !== undefined
          ? { expectedParticipantCount: input.expectedParticipantCount }
          : {}),
      },
    });

    if (ticket.shareCode && input.globalTipPercentage != null) {
      void this.broadcastUpdate(ticket.shareCode, 'ticket_status_changed');
    }

    return {
      globalTipPercentage:
        input.globalTipPercentage ??
        (ticket.globalTipPercentage != null ? Number(ticket.globalTipPercentage) : null),
      expectedParticipantCount:
        input.expectedParticipantCount !== undefined
          ? input.expectedParticipantCount
          : ticket.expectedParticipantCount,
    };
  }

  /**
   * Inicia la sesión colaborativa: genera shareCode y pasa a WAITING_FOR_PARTICIPANTS.
   */
  async startDivision(ticketId: string, input: StartDivisionInput = {}) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { _count: { select: { products: true } } },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (ticket.finalizedAt) {
      throw new AppError('Ticket already finalized', 'VALIDATION_ERROR', 409);
    }
    if (ticket._count.products < 1) {
      throw new AppError(
        'Ticket must have at least one product before starting division',
        'VALIDATION_ERROR',
        400,
      );
    }
    if (
      ticket.shareCode &&
      ACTIVE_SHARE_STATUSES.has(ticket.sessionStatus) &&
      ticket.sessionStatus !== TICKET_SESSION_STATUS.REOPENED
    ) {
      throw new AppError(
        'Division already started for this ticket',
        'VALIDATION_ERROR',
        409,
        { shareCode: ticket.shareCode },
      );
    }

    const allowedFrom: string[] = [
      TICKET_SESSION_STATUS.DRAFT,
      TICKET_SESSION_STATUS.CREATED,
      TICKET_SESSION_STATUS.REOPENED,
    ];
    if (!allowedFrom.includes(ticket.sessionStatus)) {
      throw new AppError(
        `Cannot start division from session status ${ticket.sessionStatus}`,
        'VALIDATION_ERROR',
        400,
      );
    }

    const existingAdmin = await prisma.ticketParticipant.findFirst({
      where: { ticketId, isAdmin: true },
    });
    if (!existingAdmin && !input.adminDisplayName) {
      throw new AppError(
        'Configure admin participant before starting division',
        'VALIDATION_ERROR',
        400,
      );
    }

    const shareCode = ticket.shareCode ?? (await uniqueShareCode());

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          shareCode,
          sessionStatus: TICKET_SESSION_STATUS.WAITING_FOR_PARTICIPANTS,
          divisionStartedAt: ticket.divisionStartedAt ?? new Date(),
          tipMode: 'GLOBAL',
          globalTipPercentage:
            input.globalTipPercentage != null
              ? decimal(input.globalTipPercentage)
              : ticket.globalTipPercentage,
          expectedParticipantCount: input.expectedParticipantCount ?? ticket.expectedParticipantCount,
        },
      });

      if (input.adminDisplayName) {
        const participant = await tx.participant.create({
          data: {
            name: input.adminDisplayName,
          },
        });

        await tx.ticketParticipant.upsert({
          where: {
            ticketId_participantId: { ticketId, participantId: participant.id },
          },
          create: {
            ticketId,
            participantId: participant.id,
            isAdmin: true,
            displayName: input.adminDisplayName,
            avatarId: input.adminAvatarId ?? null,
            sessionStatus: PARTICIPANT_SESSION_STATUS.CONNECTED,
            paymentStatus: PAYMENT_STATUS.PENDING,
          },
          update: {
            isAdmin: true,
            displayName: input.adminDisplayName,
            avatarId: input.adminAvatarId ?? undefined,
            sessionStatus: PARTICIPANT_SESSION_STATUS.CONNECTED,
          },
        });
      }
    });

    await markAdminSelectionComplete(ticketId);
    await maybePromoteToInProgress(ticketId);
    await maybePromoteToReviewing(ticketId);

    const share = await this.getShareInfo(ticketId);
    void this.broadcastUpdate(share.shareCode, 'ticket_started');
    return share;
  }

  async getShareInfo(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        shareCode: true,
        sessionStatus: true,
        divisionStartedAt: true,
        expectedParticipantCount: true,
        globalTipPercentage: true,
      },
    });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (!ticket.shareCode) {
      throw new AppError('Division has not been started', 'VALIDATION_ERROR', 400);
    }

    return {
      ticketId: ticket.id,
      shareCode: ticket.shareCode,
      sessionStatus: ticket.sessionStatus,
      divisionStartedAt: ticket.divisionStartedAt,
      expectedParticipantCount: ticket.expectedParticipantCount,
      globalTipPercentage:
        ticket.globalTipPercentage != null ? Number(ticket.globalTipPercentage) : null,
      publicPath: buildPublicPath(ticket.shareCode),
    };
  }

  /** Vista pública por código (sin auth). */
  async getPublicByShareCode(shareCode: string) {
    const ticket = await loadTicketByShareCode(shareCode);
    return serializePublicTicket(ticket);
  }

  /** Unirse o reanudar sesión de participante. */
  async joinSession(shareCode: string, input: PublicJoinInput = {}) {
    const ticket = await loadTicketByShareCode(shareCode);
    assertTicketJoinable(ticket);

    if (input.ticketParticipantId) {
      const existing = ticket.ticketParticipants.find(
        (tp) => tp.id === input.ticketParticipantId,
      );
      if (!existing) {
        throw new AppError('Participant session not found', 'NOT_FOUND', 404);
      }

      if (existing.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED) {
        return {
          ticket: serializePublicTicket(ticket),
          session: serializeParticipantSession(ticket, existing.id),
        };
      }

      await prisma.ticketParticipant.update({
        where: { id: existing.id },
        data: {
          sessionStatus: PARTICIPANT_SESSION_STATUS.CONNECTED,
          ...(input.avatarId ? { avatarId: input.avatarId } : {}),
          ...(input.displayName ? { displayName: input.displayName } : {}),
        },
      });
      await maybePromoteToInProgress(ticket.id);

      const refreshed = await loadTicketByShareCode(shareCode);
      const result = {
        ticket: serializePublicTicket(refreshed),
        session: serializeParticipantSession(refreshed, existing.id),
      };
      void this.broadcastUpdate(shareCode, 'participant_joined');
      return result;
    }

    const displayName =
      input.displayName?.trim() || `Participante ${ticket.ticketParticipants.length + 1}`;

    const participant = await prisma.participant.create({
      data: { name: displayName },
    });

    const created = await prisma.ticketParticipant.create({
      data: {
        ticketId: ticket.id,
        participantId: participant.id,
        displayName,
        avatarId: input.avatarId ?? null,
        sessionStatus: PARTICIPANT_SESSION_STATUS.CONNECTED,
        paymentStatus: PAYMENT_STATUS.PENDING,
      },
    });

    await maybePromoteToInProgress(ticket.id);

    const refreshed = await loadTicketByShareCode(shareCode);
    const result = {
      ticket: serializePublicTicket(refreshed),
      session: serializeParticipantSession(refreshed, created.id),
    };
    void this.broadcastUpdate(shareCode, 'participant_joined');
    return result;
  }

  /** Vista de participante con selección actual. */
  async getParticipantSession(shareCode: string, ticketParticipantId: string) {
    const ticket = await loadTicketByShareCode(shareCode);
    return {
      ticket: serializePublicTicket(ticket),
      session: serializeParticipantSession(ticket, ticketParticipantId),
    };
  }

  /** Alternar producto en la selección del participante. */
  async toggleProductSelection(
    shareCode: string,
    ticketParticipantId: string,
    productId: string,
  ) {
    const ticket = await loadTicketByShareCode(shareCode);
    assertTicketJoinable(ticket);

    const tp = ticket.ticketParticipants.find((p) => p.id === ticketParticipantId);
    if (!tp) {
      throw new AppError('Participant session not found', 'NOT_FOUND', 404);
    }

    const locked =
      tp.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED &&
      ticket.sessionStatus !== TICKET_SESSION_STATUS.REOPENED;
    if (locked) {
      throw new AppError(
        'Selection already submitted and cannot be changed',
        'VALIDATION_ERROR',
        409,
      );
    }

    const product = ticket.products.find((p) => p.id === productId);
    if (!product) {
      throw new AppError('Product not found on this ticket', 'NOT_FOUND', 404);
    }

    const existing = product.assignments.find((a) => a.participantId === tp.participantId);
    const wasSelected = Boolean(existing);
    if (existing) {
      await assignmentService.remove(existing.id);
    } else {
      await assignmentService.assignOne({
        productId,
        participantId: tp.participantId,
        shareRatio: 1,
      });
    }

    if (ticket.sessionStatus === TICKET_SESSION_STATUS.REOPENED) {
      await prisma.ticketParticipant.update({
        where: { id: tp.id },
        data: {
          sessionStatus: PARTICIPANT_SESSION_STATUS.SELECTING,
          selectionSubmittedAt: null,
        },
      });
    } else {
      await prisma.ticketParticipant.update({
        where: { id: tp.id },
        data: { sessionStatus: PARTICIPANT_SESSION_STATUS.SELECTING },
      });
    }

    await maybePromoteToInProgress(ticket.id);

    const refreshed = await loadTicketByShareCode(shareCode);
    const result = {
      ticket: serializePublicTicket(refreshed),
      session: serializeParticipantSession(refreshed, ticketParticipantId),
    };
    void this.broadcastUpdate(
      shareCode,
      wasSelected ? 'product_unselected' : 'product_selected',
    );
    if (tp.sessionStatus !== PARTICIPANT_SESSION_STATUS.SELECTING) {
      void this.broadcastUpdate(shareCode, 'participant_started');
    }
    return result;
  }

  /** Marcar selección del participante como completada. */
  async submitSelection(shareCode: string, ticketParticipantId: string) {
    const ticket = await loadTicketByShareCode(shareCode);
    assertTicketJoinable(ticket);

    const tp = ticket.ticketParticipants.find((p) => p.id === ticketParticipantId);
    if (!tp) {
      throw new AppError('Participant session not found', 'NOT_FOUND', 404);
    }

    if (
      tp.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED &&
      ticket.sessionStatus !== TICKET_SESSION_STATUS.REOPENED
    ) {
      throw new AppError('Selection already submitted', 'VALIDATION_ERROR', 409);
    }

    await prisma.ticketParticipant.update({
      where: { id: tp.id },
      data: {
        sessionStatus: PARTICIPANT_SESSION_STATUS.COMPLETED,
        selectionSubmittedAt: new Date(),
      },
    });

    await maybePromoteToReviewing(ticket.id);

    const refreshed = await loadTicketByShareCode(shareCode);
    const result = {
      ticket: serializePublicTicket(refreshed),
      session: serializeParticipantSession(refreshed, ticketParticipantId),
    };
    void this.broadcastUpdate(shareCode, 'participant_completed');
    if (refreshed.sessionStatus === TICKET_SESSION_STATUS.REVIEWING) {
      void this.broadcastUpdate(shareCode, 'ticket_status_changed');
    }
    return result;
  }

  /** Marca pago manual de un participante (sin pasarela). */
  async updatePaymentStatus(
    ticketId: string,
    ticketParticipantId: string,
    paymentStatus: PaymentStatus,
  ) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (ticket.finalizedAt) {
      throw new AppError('Ticket already finalized', 'VALIDATION_ERROR', 409);
    }
    if (!ticket.shareCode) {
      throw new AppError('Not a collaborative ticket', 'VALIDATION_ERROR', 400);
    }
    if (!ACTIVE_COLLABORATION_STATUSES.has(ticket.sessionStatus)) {
      throw new AppError(
        'Cannot update payment status for this ticket state',
        'VALIDATION_ERROR',
        400,
      );
    }

    const tp = await prisma.ticketParticipant.findFirst({
      where: { id: ticketParticipantId, ticketId },
    });
    if (!tp) {
      throw new AppError('Participant not found on this ticket', 'NOT_FOUND', 404);
    }

    await prisma.ticketParticipant.update({
      where: { id: tp.id },
      data: { paymentStatus },
    });

    void this.broadcastUpdate(ticket.shareCode, 'payment_status_changed');

    return { ticketParticipantId: tp.id, paymentStatus };
  }

  notifyTicketUpdate(shareCode: string, event: CollaborationRealtimeEvent) {
    void this.broadcastUpdate(shareCode, event);
  }
}

export const collaborationService = new CollaborationService();
