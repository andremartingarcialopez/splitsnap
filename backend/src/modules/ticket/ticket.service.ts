import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { aiService } from '../ai/ai.service';
import { ocrService } from '../ocr/ocr.service';
import type { OcrImageInput } from '../ocr/ocr.port';
import type { CreateTicketInput } from '../../validators/ticket.validator';
import { saveTicketImage } from './storage';
import { normalizeParsedTicket } from '../ai/productNormalizer';
import { TICKET_SESSION_STATUS } from '../collaboration/collaboration.types';
import { collaborationService } from '../collaboration/collaboration.service';
import { calculationService } from '../calculation/calculation.service';
import {
  buildInitialTicketTotals,
  syncTicketTotalsFromProducts,
  ticketTotalsToPrismaData,
} from './ticketTotals.service';

function decimal(n: number | null | undefined): Prisma.Decimal | null {
  if (n == null || Number.isNaN(n)) return null;
  return new Prisma.Decimal(n.toFixed(2));
}

const ticketDetailInclude = {
  products: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      assignments: {
        include: { participant: true },
      },
    },
  },
  ticketParticipants: {
    include: { participant: true },
    orderBy: { createdAt: 'asc' as const },
  },
  ticketGroups: {
    include: { group: true },
  },
} satisfies Prisma.TicketInclude;

type TicketDetail = Prisma.TicketGetPayload<{ include: typeof ticketDetailInclude }>;

function serializeProduct(p: TicketDetail['products'][number]) {
  return {
    id: p.id,
    ticketId: p.ticketId,
    name: p.name,
    unitPrice: Number(p.unitPrice),
    detectedByAI: p.detectedByAI,
    confidenceScore: p.confidenceScore != null ? Number(p.confidenceScore) : null,
    lineGroupId: p.lineGroupId,
    isIndivisible: p.isIndivisible,
    emoji: p.emoji,
    createdAt: p.createdAt,
    assignments: p.assignments.map((a) => ({
      id: a.id,
      productId: a.productId,
      participantId: a.participantId,
      shareRatio: Number(a.shareRatio),
      createdAt: a.createdAt,
      participant: a.participant,
    })),
  };
}

function serializeTicketDetail(ticket: TicketDetail) {
  return {
    id: ticket.id,
    title: ticket.title,
    restaurantName: ticket.restaurantName,
    ticketImageUrl: ticket.ticketImageUrl,
    subtotal: ticket.subtotal != null ? Number(ticket.subtotal) : null,
    tax: ticket.tax != null ? Number(ticket.tax) : null,
    discount: ticket.discount != null ? Number(ticket.discount) : null,
    total: ticket.total != null ? Number(ticket.total) : null,
    printedTotal: ticket.printedTotal != null ? Number(ticket.printedTotal) : null,
    scanTaxRate: ticket.scanTaxRate != null ? Number(ticket.scanTaxRate) : null,
    tipMode: ticket.tipMode,
    globalTipPercentage:
      ticket.globalTipPercentage != null ? Number(ticket.globalTipPercentage) : null,
    processingStatus: ticket.processingStatus,
    sessionStatus: ticket.sessionStatus,
    shareCode: ticket.shareCode,
    expectedParticipantCount: ticket.expectedParticipantCount,
    divisionStartedAt: ticket.divisionStartedAt,
    failureReason: ticket.failureReason,
    rawOcrText: ticket.rawOcrText,
    finalizedAt: ticket.finalizedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    products: ticket.products.map(serializeProduct),
    participants: ticket.ticketParticipants.map((tp) => ({
      id: tp.id,
      ticketId: tp.ticketId,
      participantId: tp.participantId,
      individualTipPercentage:
        tp.individualTipPercentage != null ? Number(tp.individualTipPercentage) : null,
      sessionStatus: tp.sessionStatus,
      paymentStatus: tp.paymentStatus,
      isAdmin: tp.isAdmin,
      avatarId: tp.avatarId,
      displayName: tp.displayName,
      selectionSubmittedAt: tp.selectionSubmittedAt,
      createdAt: tp.createdAt,
      updatedAt: tp.updatedAt,
      participant: tp.participant,
    })),
    groups: ticket.ticketGroups.map((tg) => ({
      id: tg.id,
      ticketId: tg.ticketId,
      groupId: tg.groupId,
      createdAt: tg.createdAt,
      group: tg.group,
    })),
    participantCount: ticket.ticketParticipants.length,
    productCount: ticket.products.length,
  };
}

function serializeTicketListItem(
  ticket: Prisma.TicketGetPayload<{
    include: {
      _count: { select: { products: true; ticketParticipants: true } };
    };
  }>,
) {
  return {
    id: ticket.id,
    title: ticket.title,
    restaurantName: ticket.restaurantName,
    ticketImageUrl: ticket.ticketImageUrl,
    subtotal: ticket.subtotal != null ? Number(ticket.subtotal) : null,
    tax: ticket.tax != null ? Number(ticket.tax) : null,
    discount: ticket.discount != null ? Number(ticket.discount) : null,
    total: ticket.total != null ? Number(ticket.total) : null,
    printedTotal: ticket.printedTotal != null ? Number(ticket.printedTotal) : null,
    scanTaxRate: ticket.scanTaxRate != null ? Number(ticket.scanTaxRate) : null,
    tipMode: ticket.tipMode,
    globalTipPercentage:
      ticket.globalTipPercentage != null ? Number(ticket.globalTipPercentage) : null,
    processingStatus: ticket.processingStatus,
    sessionStatus: ticket.sessionStatus,
    shareCode: ticket.shareCode,
    failureReason: ticket.failureReason,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    productCount: ticket._count.products,
    participantCount: ticket._count.ticketParticipants,
  };
}

/**
 * TicketService — CRUD US-004 + pipeline US-003.
 */
const REPROCESS_SESSION_STATUSES = new Set<string>([
  TICKET_SESSION_STATUS.DRAFT,
  TICKET_SESSION_STATUS.CREATED,
]);

type ScanPipelineResult = {
  ticket: Awaited<ReturnType<TicketService['getById']>>;
  products: Awaited<ReturnType<TicketService['getById']>>['products'];
  pipeline: {
    mock: boolean;
    warnings?: string[];
    confidence?: number | null;
    parsingNotes?: string | null;
  };
};

export class TicketService {
  async list() {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { products: true, ticketParticipants: true } },
      },
    });
    return tickets.map(serializeTicketListItem);
  }

  async getById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: ticketDetailInclude,
    });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    return serializeTicketDetail(ticket);
  }

  /** POST /tickets — crear sin imagen (MDD §4) */
  async create(input: CreateTicketInput) {
    const products = input.products ?? [];
    for (const p of products) {
      if (!(p.unitPrice > 0)) {
        throw new AppError('unitPrice must be > 0', 'VALIDATION_ERROR', 400);
      }
    }

    if (input.participantIds?.length) {
      const count = await prisma.participant.count({
        where: { id: { in: input.participantIds } },
      });
      if (count !== input.participantIds.length) {
        throw new AppError('One or more participants not found', 'NOT_FOUND', 404);
      }
    }

    if (input.groupIds?.length) {
      const count = await prisma.group.count({
        where: { id: { in: input.groupIds } },
      });
      if (count !== input.groupIds.length) {
        throw new AppError('One or more groups not found', 'NOT_FOUND', 404);
      }
    }

    const computedSubtotal =
      products.length > 0
        ? products.reduce((a, p) => a + p.unitPrice, 0)
        : input.subtotal ?? null;

    const initialTotals =
      computedSubtotal != null
        ? buildInitialTicketTotals(computedSubtotal, {
            tax: input.tax,
            discount: input.discount,
            total: input.total ?? computedSubtotal,
            printedTotal: input.total ?? computedSubtotal,
          })
        : null;

    const ticket = await prisma.ticket.create({
      data: {
        title:
          input.title?.trim() ||
          input.restaurantName?.trim() ||
          'Nuevo ticket',
        restaurantName: input.restaurantName?.trim() || null,
        ticketImageUrl: input.ticketImageUrl?.trim() || '/uploads/tickets/manual-placeholder',
        ...(initialTotals
          ? ticketTotalsToPrismaData(initialTotals)
          : {
              subtotal: decimal(input.subtotal ?? null),
              tax: decimal(input.tax),
              discount: decimal(input.discount ?? 0),
              total: decimal(input.total),
            }),
        tipMode: input.tipMode ?? 'GLOBAL',
        globalTipPercentage: decimal(input.globalTipPercentage),
        processingStatus: products.length ? 'COMPLETED' : 'PENDING',
        sessionStatus: products.length
          ? TICKET_SESSION_STATUS.CREATED
          : TICKET_SESSION_STATUS.DRAFT,
        products: products.length
          ? {
              create: products.map((p) => ({
                name: p.name.trim(),
                unitPrice: decimal(p.unitPrice)!,
                detectedByAI: false,
              })),
            }
          : undefined,
        ticketParticipants: input.participantIds?.length
          ? {
              create: input.participantIds.map((participantId) => ({ participantId })),
            }
          : undefined,
        ticketGroups: input.groupIds?.length
          ? {
              create: input.groupIds.map((groupId) => ({ groupId })),
            }
          : undefined,
      },
      include: ticketDetailInclude,
    });

    return serializeTicketDetail(ticket);
  }

  /** Compat US-003: ingreso manual con productos obligatorios */
  async createManual(input: {
    title?: string;
    restaurantName?: string | null;
    products: Array<{ name: string; unitPrice: number }>;
  }) {
    if (!input.products?.length) {
      throw new AppError('At least one product is required', 'VALIDATION_ERROR', 400);
    }
    return this.create({
      title: input.title,
      restaurantName: input.restaurantName,
      products: input.products,
      tipMode: 'GLOBAL',
      participantIds: [],
      groupIds: [],
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await prisma.ticket.delete({ where: { id } });
    return { id };
  }

  async addParticipant(
    ticketId: string,
    input: { participantId: string; individualTipPercentage?: number | null },
  ) {
    await this.getById(ticketId);
    const participant = await prisma.participant.findUnique({
      where: { id: input.participantId },
    });
    if (!participant) {
      throw new AppError('Participant not found', 'NOT_FOUND', 404);
    }

    try {
      await prisma.ticketParticipant.create({
        data: {
          ticketId,
          participantId: input.participantId,
          individualTipPercentage: decimal(input.individualTipPercentage),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new AppError(
          'Participant already on ticket',
          'VALIDATION_ERROR',
          409,
        );
      }
      throw err;
    }

    return this.getById(ticketId);
  }

  async previewRemoveParticipant(ticketId: string, participantId: string) {
    const link = await prisma.ticketParticipant.findUnique({
      where: {
        ticketId_participantId: { ticketId, participantId },
      },
    });
    if (!link) {
      throw new AppError('Participant not on ticket', 'NOT_FOUND', 404);
    }

    const products = await prisma.product.findMany({
      where: { ticketId },
      include: { assignments: true },
    });

    const orphanedProducts = products
      .filter(
        (p) =>
          p.assignments.length === 1 &&
          p.assignments[0]?.participantId === participantId,
      )
      .map((p) => ({ id: p.id, name: p.name }));

    return { orphanedProducts };
  }

  async removeParticipant(ticketId: string, participantId: string) {
    const link = await prisma.ticketParticipant.findUnique({
      where: {
        ticketId_participantId: { ticketId, participantId },
      },
    });
    if (!link) {
      throw new AppError('Participant not on ticket', 'NOT_FOUND', 404);
    }

    const preview = await this.previewRemoveParticipant(ticketId, participantId);

    // Cascada de asignaciones del participante en productos de este ticket (MDD US-006)
    await prisma.$transaction(async (tx) => {
      const productIds = (
        await tx.product.findMany({
          where: { ticketId },
          select: { id: true },
        })
      ).map((p) => p.id);

      if (productIds.length) {
        await tx.productAssignment.deleteMany({
          where: {
            participantId,
            productId: { in: productIds },
          },
        });
      }

      await tx.ticketParticipant.delete({
        where: { id: link.id },
      });
    });

    const ticket = await this.getById(ticketId);
    return { ticket, orphanedProducts: preview.orphanedProducts };
  }

  async updateTip(
    ticketId: string,
    input: { tipMode: 'GLOBAL' | 'INDIVIDUAL'; globalTipPercentage: number },
  ) {
    const ticket = await this.getById(ticketId);
    const previousMode = ticket.tipMode;
    const globalTip = decimal(input.globalTipPercentage);

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          tipMode: input.tipMode,
          globalTipPercentage: globalTip,
        },
      });

      // MDD §5.6: al pasar a individual, copiar % global como valor inicial
      if (previousMode === 'GLOBAL' && input.tipMode === 'INDIVIDUAL') {
        await tx.ticketParticipant.updateMany({
          where: { ticketId },
          data: { individualTipPercentage: globalTip },
        });
      }
    });

    return this.getById(ticketId);
  }

  async updateParticipantTip(
    ticketId: string,
    participantId: string,
    input: { individualTipPercentage: number },
  ) {
    const ticket = await this.getById(ticketId);
    if (ticket.tipMode !== 'INDIVIDUAL') {
      throw new AppError(
        'Individual tip only applies when tipMode is INDIVIDUAL',
        'VALIDATION_ERROR',
        400,
      );
    }

    const link = await prisma.ticketParticipant.findUnique({
      where: {
        ticketId_participantId: { ticketId, participantId },
      },
    });
    if (!link) {
      throw new AppError('Participant not on ticket', 'NOT_FOUND', 404);
    }

    await prisma.ticketParticipant.update({
      where: { id: link.id },
      data: { individualTipPercentage: decimal(input.individualTipPercentage) },
    });

    return this.getById(ticketId);
  }

  async finalize(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, shareCode: true, finalizedAt: true },
    });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (ticket.finalizedAt) {
      throw new AppError('Ticket already finalized', 'VALIDATION_ERROR', 409);
    }

    const summary = await calculationService.summarize(ticketId);
    const isCollaborative = Boolean(ticket.shareCode);

    if (isCollaborative) {
      if (!summary.canClose) {
        if (!summary.allParticipantsCompleted) {
          throw new AppError(
            'All participants must complete their selection before closing',
            'VALIDATION_ERROR',
            400,
          );
        }
        if (!summary.allParticipantsPaid) {
          throw new AppError(
            'All participants must be marked as paid before closing',
            'PAYMENT_PENDING',
            400,
          );
        }
        const orphanNames = summary.unassignedProducts.map((p) => p.name).join(', ');
        throw new AppError(
          orphanNames
            ? `Cannot finalize: unassigned products (${orphanNames})`
            : 'Cannot finalize: check participants, products and assignments',
          'ORPHAN_PRODUCT',
          400,
          { unassignedProducts: summary.unassignedProducts },
        );
      }
    } else if (!summary.canFinalize) {
      const orphanNames = summary.unassignedProducts.map((p) => p.name).join(', ');
      throw new AppError(
        orphanNames
          ? `Cannot finalize: unassigned products (${orphanNames})`
          : 'Cannot finalize: check participants, products and assignments',
        'ORPHAN_PRODUCT',
        400,
        { unassignedProducts: summary.unassignedProducts },
      );
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        processingStatus: 'COMPLETED',
        finalizedAt: new Date(),
        ...(isCollaborative ? { sessionStatus: TICKET_SESSION_STATUS.FINISHED } : {}),
      },
    });

    if (ticket.shareCode) {
      collaborationService.notifyTicketUpdate(ticket.shareCode, 'ticket_finalized');
    }

    return this.getById(ticketId);
  }

  async linkGroup(ticketId: string, groupId: string) {
    await this.getById(ticketId);
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { groupParticipants: true },
    });
    if (!group) {
      throw new AppError('Group not found', 'NOT_FOUND', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticketGroup.upsert({
        where: {
          ticketId_groupId: { ticketId, groupId },
        },
        create: { ticketId, groupId },
        update: {},
      });

      for (const gp of group.groupParticipants) {
        await tx.ticketParticipant.upsert({
          where: {
            ticketId_participantId: {
              ticketId,
              participantId: gp.participantId,
            },
          },
          create: { ticketId, participantId: gp.participantId },
          update: {},
        });
      }
    });

    return this.getById(ticketId);
  }

  /** Solo antes de iniciar división colaborativa. */
  private async assertCanReprocess(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }
    if (ticket.finalizedAt) {
      throw new AppError('Ticket already finalized', 'VALIDATION_ERROR', 409);
    }
    if (ticket.shareCode) {
      throw new AppError(
        'No se puede reescanear: la división ya inició',
        'VALIDATION_ERROR',
        409,
      );
    }
    if (!REPROCESS_SESSION_STATUSES.has(ticket.sessionStatus)) {
      throw new AppError(
        'No se puede reescanear en el estado actual del ticket',
        'VALIDATION_ERROR',
        409,
      );
    }
    return ticket;
  }

  private async applyScanPipeline(
    ticketId: string,
    image: OcrImageInput,
    imageUrl: string,
  ): Promise<ScanPipelineResult> {
    const { cleaned, text } = await ocrService.extractFromImage(image);
    const parsedRaw = await aiService.parseTicket(cleaned);
    const parsed = normalizeParsedTicket(parsedRaw, { ocrText: cleaned });

    const restaurant = parsed.restaurantName?.trim() || null;
    const title = restaurant || 'Ticket digitalizado';
    const productsSum = parsed.normalizedProducts.reduce(
      (acc, item) => acc + item.unitPrice,
      0,
    );
    const initialTotals = buildInitialTicketTotals(productsSum, {
      tax: parsed.tax,
      discount: parsed.discount,
      total: parsed.total,
      printedTotal: parsed.total,
    });

    await prisma.$transaction(async (tx) => {
      await tx.product.deleteMany({ where: { ticketId } });
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          title,
          restaurantName: restaurant,
          ticketImageUrl: imageUrl,
          ...ticketTotalsToPrismaData(initialTotals),
          processingStatus: 'COMPLETED',
          sessionStatus: TICKET_SESSION_STATUS.CREATED,
          rawOcrText: text,
          failureReason: null,
          products: {
            create: parsed.normalizedProducts.map((item) => ({
              name: item.name,
              unitPrice: decimal(item.unitPrice)!,
              detectedByAI: true,
              confidenceScore:
                item.confidenceScore != null
                  ? new Prisma.Decimal(item.confidenceScore)
                  : null,
              lineGroupId: item.lineGroupId,
              isIndivisible: item.isIndivisible,
            })),
          },
        },
      });
    });

    const full = await this.getById(ticketId);
    return {
      ticket: full,
      products: full.products,
      pipeline: {
        mock: false,
        ...(parsed.warnings?.length ? { warnings: parsed.warnings } : {}),
        ...(parsed.confidence != null ? { confidence: parsed.confidence } : {}),
        ...(parsed.parsingNotes ? { parsingNotes: parsed.parsingNotes } : {}),
      },
    };
  }

  private async failScanPipeline(ticketId: string, err: unknown): Promise<never> {
    const message =
      err instanceof AppError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Pipeline failed';
    const code = err instanceof AppError ? err.code : 'AI_PARSE_ERROR';

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        processingStatus: 'FAILED',
        failureReason: message.slice(0, 500),
        title: 'Ticket fallido — ingreso manual disponible',
      },
    });

    const failed = await this.getById(ticketId);

    throw new AppError(
      message,
      code,
      err instanceof AppError ? err.statusCode : 502,
      {
        ticketId: failed.id,
        processingStatus: 'FAILED',
        allowManualEntry: true,
        ticket: failed,
      },
    );
  }

  async processImage(image: OcrImageInput) {
    const saved = await saveTicketImage(image);

    const ticket = await prisma.ticket.create({
      data: {
        title: 'Procesando ticket…',
        restaurantName: null,
        ticketImageUrl: saved.publicUrl,
        processingStatus: 'PROCESSING',
      },
    });

    try {
      return await this.applyScanPipeline(ticket.id, image, saved.publicUrl);
    } catch (err) {
      return this.failScanPipeline(ticket.id, err);
    }
  }

  async reprocessImage(ticketId: string, image: OcrImageInput) {
    await this.assertCanReprocess(ticketId);
    const saved = await saveTicketImage(image);

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { processingStatus: 'PROCESSING', failureReason: null },
    });

    try {
      return await this.applyScanPipeline(ticketId, image, saved.publicUrl);
    } catch (err) {
      return this.failScanPipeline(ticketId, err);
    }
  }

  async updateProduct(
    ticketId: string,
    productId: string,
    input: { name?: string; unitPrice?: number; scope?: 'single' | 'group' },
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, ticketId },
    });
    if (!product) {
      throw new AppError('Product not found', 'NOT_FOUND', 404);
    }
    if (input.unitPrice !== undefined && !(input.unitPrice > 0)) {
      throw new AppError('unitPrice must be > 0', 'VALIDATION_ERROR', 400);
    }

    const scope = input.scope ?? 'single';
    const patch: { name?: string; unitPrice?: Prisma.Decimal } = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.unitPrice !== undefined) patch.unitPrice = decimal(input.unitPrice)!;

    if (Object.keys(patch).length === 0) {
      throw new AppError('Nothing to update', 'VALIDATION_ERROR', 400);
    }

    if (scope === 'group') {
      const groupWhere = product.lineGroupId
        ? { ticketId, lineGroupId: product.lineGroupId }
        : { ticketId, name: product.name };

      await prisma.product.updateMany({ where: groupWhere, data: patch });
    } else {
      await prisma.product.update({ where: { id: productId }, data: patch });
    }

    await syncTicketTotalsFromProducts(ticketId);

    const updated = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });

    return {
      ...updated,
      unitPrice: Number(updated.unitPrice),
      confidenceScore:
        updated.confidenceScore != null ? Number(updated.confidenceScore) : null,
    };
  }

  async addProduct(ticketId: string, input: { name: string; unitPrice: number }) {
    await this.getById(ticketId);
    if (!input.name?.trim() || !(input.unitPrice > 0)) {
      throw new AppError(
        'name and unitPrice > 0 are required',
        'VALIDATION_ERROR',
        400,
      );
    }
    const created = await prisma.product.create({
      data: {
        ticketId,
        name: input.name.trim(),
        unitPrice: decimal(input.unitPrice)!,
        detectedByAI: false,
      },
    });
    await syncTicketTotalsFromProducts(ticketId);
    return {
      ...created,
      unitPrice: Number(created.unitPrice),
      confidenceScore: null,
    };
  }

  async deleteProduct(ticketId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, ticketId },
    });
    if (!product) {
      throw new AppError('Product not found', 'NOT_FOUND', 404);
    }
    await prisma.product.delete({ where: { id: productId } });
    await syncTicketTotalsFromProducts(ticketId);
    return { id: productId };
  }
}

export const ticketService = new TicketService();
