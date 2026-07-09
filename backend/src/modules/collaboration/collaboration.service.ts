import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { generateShareCode } from '../../utils/shareCode';
import type {
  AdminSetupInput,
  CollaborationSettingsInput,
  StartDivisionInput,
} from '../../validators/collaboration.validator';
import {
  PARTICIPANT_SESSION_STATUS,
  PAYMENT_STATUS,
  TICKET_SESSION_STATUS,
} from './collaboration.types';

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

function buildPublicPath(shareCode: string): string {
  return `/ticket/${shareCode}`;
}

const PRE_DIVISION_STATUSES = new Set<string>([
  TICKET_SESSION_STATUS.DRAFT,
  TICKET_SESSION_STATUS.CREATED,
  TICKET_SESSION_STATUS.REOPENED,
]);

export class CollaborationService {
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

  /** Propina global y participantes esperados antes de iniciar división. */
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
    if (!PRE_DIVISION_STATUSES.has(ticket.sessionStatus)) {
      throw new AppError(
        'Cannot update settings after division has started',
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
        ...(input.expectedParticipantCount !== undefined
          ? { expectedParticipantCount: input.expectedParticipantCount }
          : {}),
      },
    });

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

    return this.getShareInfo(ticketId);
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

  /** Vista pública por código (sin auth) — base Fase 1. */
  async getPublicByShareCode(shareCode: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { shareCode },
      include: {
        products: {
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { assignments: true } } },
        },
        ticketParticipants: {
          include: { participant: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }

    const completedCount = ticket.ticketParticipants.filter(
      (tp) => tp.sessionStatus === PARTICIPANT_SESSION_STATUS.COMPLETED,
    ).length;

    return {
      id: ticket.id,
      shareCode: ticket.shareCode,
      title: ticket.title,
      restaurantName: ticket.restaurantName,
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
      products: ticket.products.map((p) => ({
        id: p.id,
        name: p.name,
        unitPrice: Number(p.unitPrice),
        emoji: p.emoji,
        isIndivisible: p.isIndivisible,
        assignmentCount: p._count.assignments,
      })),
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
}

export const collaborationService = new CollaborationService();
