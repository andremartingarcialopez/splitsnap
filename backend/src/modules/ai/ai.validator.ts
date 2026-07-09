import { z } from 'zod';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import type { ParsedTicket } from './ai.port';

const itemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  unitPrice: z.coerce.number().positive('unitPrice must be > 0'),
  quantity: z.coerce.number().int().positive().optional().default(1),
  indivisible: z.coerce.boolean().optional().default(false),
  confidenceScore: z.coerce.number().min(0).max(100).optional().nullable(),
});

export const parsedTicketSchema = z.object({
  restaurantName: z.string().trim().max(150).optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one product is required'),
  subtotal: z.coerce.number().nonnegative().optional().nullable(),
  tax: z.coerce.number().nonnegative().optional().nullable(),
  discount: z.coerce.number().nonnegative().optional().nullable(),
  total: z.coerce.number().nonnegative().optional().nullable(),
});

export type ValidatedParsedTicket = z.infer<typeof parsedTicketSchema>;

/**
 * AiAuditor — MDD §5.2 / Blueprint §4.1
 * Valida estructura y coherencia de montos (umbral CALC_TOTAL_VARIANCE_THRESHOLD).
 */
export function auditParsedTicket(raw: unknown): ParsedTicket {
  const parsed = parsedTicketSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      'AI ticket JSON failed structural validation',
      'AI_PARSE_ERROR',
      422,
      parsed.error.flatten(),
    );
  }

  const data = parsed.data;
  const itemsSum = data.items.reduce((acc, i) => acc + i.unitPrice, 0);
  const threshold = env.CALC_TOTAL_VARIANCE_THRESHOLD;
  const warnings: string[] = [];

  if (data.subtotal != null) {
    const rel = Math.abs(data.subtotal - itemsSum) / Math.max(data.subtotal, itemsSum, 1);
    if (rel > threshold) {
      warnings.push(
        `subtotal ${data.subtotal} diverges from items sum ${itemsSum.toFixed(2)} beyond ${threshold}`,
      );
    }
  }

  if (
    data.total != null &&
    data.subtotal != null &&
    data.tax != null
  ) {
    const discount = data.discount ?? 0;
    const expected = data.subtotal + data.tax - discount;
    const rel = Math.abs(data.total - expected) / Math.max(data.total, expected, 1);
    if (rel > threshold) {
      warnings.push(
        `total ${data.total} diverges from subtotal+tax-discount ${expected.toFixed(2)} beyond ${threshold}`,
      );
    }
  }

  // Coherencia: advertencia no bloquea MVP (HITL-01), pero fallos estructurales sí.
  // Si no hay items válidos ya falló arriba. Si warnings extremos y sin precios — ok.
  if (warnings.length && process.env.NODE_ENV === 'development') {
    console.warn('[AiAuditor]', warnings);
  }

  return {
    restaurantName: data.restaurantName ?? null,
    items: data.items.map((i) => ({
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity ?? 1,
      indivisible: i.indivisible ?? false,
      confidenceScore: i.confidenceScore ?? null,
    })),
    subtotal: data.subtotal ?? null,
    tax: data.tax ?? null,
    discount: data.discount ?? 0,
    total: data.total ?? null,
  };
}
