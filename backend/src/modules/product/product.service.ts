import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '../../validators/product.validator';

function decimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(2));
}

function serialize(p: {
  id: string;
  ticketId: string;
  name: string;
  unitPrice: Prisma.Decimal;
  detectedByAI: boolean;
  confidenceScore: Prisma.Decimal | null;
  createdAt: Date;
}) {
  return {
    ...p,
    unitPrice: Number(p.unitPrice),
    confidenceScore: p.confidenceScore != null ? Number(p.confidenceScore) : null,
  };
}

export class ProductService {
  async create(input: CreateProductInput) {
    const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
    if (!ticket) {
      throw new AppError('Ticket not found', 'NOT_FOUND', 404);
    }

    const created = await prisma.product.create({
      data: {
        ticketId: input.ticketId,
        name: input.name.trim(),
        unitPrice: decimal(input.unitPrice),
        detectedByAI: false,
      },
    });
    return serialize(created);
  }

  async update(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 'NOT_FOUND', 404);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.unitPrice !== undefined ? { unitPrice: decimal(input.unitPrice) } : {}),
      },
    });
    return serialize(updated);
  }

  async remove(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 'NOT_FOUND', 404);
    }
    // Cascade ProductAssignment vía FK ON DELETE CASCADE
    await prisma.product.delete({ where: { id } });
    return { id };
  }
}

export const productService = new ProductService();
