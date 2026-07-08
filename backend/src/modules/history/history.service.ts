import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { calculationService } from '../calculation/calculation.service';
import { ticketService } from '../ticket/ticket.service';

export type HistoryListItem = {
  id: string;
  title: string;
  restaurantName: string | null;
  total: number | null;
  grandTotal: number;
  createdAt: Date;
  finalizedAt: Date;
  participantCount: number;
  productCount: number;
  participantNames: string[];
};

export type HistoryDetail = {
  ticket: Awaited<ReturnType<typeof ticketService.getById>>;
  summary: Awaited<ReturnType<typeof calculationService.summarize>>;
};

function serializeListItem(
  ticket: {
    id: string;
    title: string;
    restaurantName: string | null;
    total: { toString(): string } | null;
    createdAt: Date;
    finalizedAt: Date | null;
    _count: { products: number; ticketParticipants: number };
    ticketParticipants: Array<{ participant: { name: string | null } }>;
  },
  grandTotal: number,
): HistoryListItem {
  return {
    id: ticket.id,
    title: ticket.title,
    restaurantName: ticket.restaurantName,
    total: ticket.total != null ? Number(ticket.total) : null,
    grandTotal,
    createdAt: ticket.createdAt,
    finalizedAt: ticket.finalizedAt!,
    participantCount: ticket._count.ticketParticipants,
    productCount: ticket._count.products,
    participantNames: ticket.ticketParticipants
      .map((tp) => tp.participant.name)
      .filter((n): n is string => Boolean(n)),
  };
}

export class HistoryService {
  async list(): Promise<HistoryListItem[]> {
    const tickets = await prisma.ticket.findMany({
      where: {
        finalizedAt: { not: null },
        processingStatus: 'COMPLETED',
      },
      orderBy: { finalizedAt: 'desc' },
      include: {
        _count: {
          select: { products: true, ticketParticipants: true },
        },
        ticketParticipants: {
          include: { participant: true },
          take: 5,
        },
      },
    });

    const items: HistoryListItem[] = [];
    for (const ticket of tickets) {
      const summary = await calculationService.summarize(ticket.id);
      items.push(serializeListItem(ticket, summary.grandTotal));
    }
    return items;
  }

  async getById(id: string): Promise<HistoryDetail> {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, finalizedAt: true, processingStatus: true },
    });

    if (!ticket || !ticket.finalizedAt || ticket.processingStatus !== 'COMPLETED') {
      throw new AppError('Historical ticket not found', 'NOT_FOUND', 404);
    }

    const [detail, summary] = await Promise.all([
      ticketService.getById(id),
      calculationService.summarize(id),
    ]);

    return { ticket: detail, summary };
  }
}

export const historyService = new HistoryService();
