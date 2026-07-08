import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type {
  AssignOneInput,
  AssignSharedInput,
} from '../../validators/assignment.validator';

function ratio(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(4));
}

function serializeAssignment(a: {
  id: string;
  productId: string;
  participantId: string;
  shareRatio: Prisma.Decimal;
  createdAt: Date;
  participant?: {
    id: string;
    name: string | null;
    photoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  product?: {
    id: string;
    ticketId: string;
    name: string;
    unitPrice: Prisma.Decimal;
  };
}) {
  return {
    id: a.id,
    productId: a.productId,
    participantId: a.participantId,
    shareRatio: Number(a.shareRatio),
    createdAt: a.createdAt,
    participant: a.participant,
    product: a.product
      ? {
          id: a.product.id,
          ticketId: a.product.ticketId,
          name: a.product.name,
          unitPrice: Number(a.product.unitPrice),
        }
      : undefined,
  };
}

async function assertProductOnTicket(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Product not found', 'NOT_FOUND', 404);
  }
  return product;
}

async function assertParticipantOnTicket(ticketId: string, participantId: string) {
  const onTicket = await prisma.ticketParticipant.findUnique({
    where: {
      ticketId_participantId: { ticketId, participantId },
    },
  });
  if (!onTicket) {
    throw new AppError(
      'Participant is not on this ticket. Add them to the ticket first.',
      'VALIDATION_ERROR',
      400,
    );
  }
}

/**
 * AssignmentService — MDD §4 + §3 shareRatio.
 * MVP equitativo: shareRatio = 1 por asignado; el cálculo usa shareRatio / Σ.
 */
export class AssignmentService {
  async listByTicket(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }

    const products = await prisma.product.findMany({
      where: { ticketId },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);
    if (!productIds.length) return [];

    const assignments = await prisma.productAssignment.findMany({
      where: { productId: { in: productIds } },
      include: {
        participant: true,
        product: {
          select: { id: true, ticketId: true, name: true, unitPrice: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return assignments.map(serializeAssignment);
  }

  async assignOne(input: AssignOneInput) {
    const product = await assertProductOnTicket(input.productId);
    await assertParticipantOnTicket(product.ticketId, input.participantId);

    try {
      const created = await prisma.productAssignment.create({
        data: {
          productId: input.productId,
          participantId: input.participantId,
          shareRatio: ratio(input.shareRatio ?? 1),
        },
        include: {
          participant: true,
          product: {
            select: { id: true, ticketId: true, name: true, unitPrice: true },
          },
        },
      });
      return serializeAssignment(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new AppError(
          'Participant already assigned to this product',
          'VALIDATION_ERROR',
          409,
        );
      }
      throw err;
    }
  }

  async assignShared(input: AssignSharedInput) {
    const product = await assertProductOnTicket(input.productId);
    const uniqueIds = [...new Set(input.participantIds)];
    if (uniqueIds.length < 2) {
      throw new AppError(
        'Shared assignment requires at least 2 distinct participants',
        'VALIDATION_ERROR',
        400,
      );
    }

    if (input.shareRatios && input.shareRatios.length !== uniqueIds.length) {
      throw new AppError(
        'shareRatios length must match participantIds',
        'VALIDATION_ERROR',
        400,
      );
    }

    for (const pid of uniqueIds) {
      await assertParticipantOnTicket(product.ticketId, pid);
    }

    // Reemplaza asignaciones previas del producto (re-asignación compartida limpia)
    const created = await prisma.$transaction(async (tx) => {
      await tx.productAssignment.deleteMany({ where: { productId: input.productId } });

      const rows = [];
      for (let i = 0; i < uniqueIds.length; i++) {
        const share = input.shareRatios?.[i] ?? 1;
        const row = await tx.productAssignment.create({
          data: {
            productId: input.productId,
            participantId: uniqueIds[i],
            shareRatio: ratio(share),
          },
          include: {
            participant: true,
            product: {
              select: { id: true, ticketId: true, name: true, unitPrice: true },
            },
          },
        });
        rows.push(row);
      }
      return rows;
    });

    return created.map(serializeAssignment);
  }

  async remove(id: string) {
    const existing = await prisma.productAssignment.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Assignment not found', 'NOT_FOUND', 404);
    }
    await prisma.productAssignment.delete({ where: { id } });
    return { id };
  }
}

export const assignmentService = new AssignmentService();
