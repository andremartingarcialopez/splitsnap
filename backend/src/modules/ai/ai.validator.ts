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
  warnings: z.array(z.string().trim().min(1).max(300)).optional().nullable(),
  confidence: z.coerce.number().min(0).max(100).optional().nullable(),
  parsingNotes: z.string().trim().max(500).optional().nullable(),
});

export type ValidatedParsedTicket = z.infer<typeof parsedTicketSchema>;

export function normalizeProductNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sumLineTotals(items: Array<{ unitPrice: number }>): number {
  return items.reduce((acc, i) => acc + i.unitPrice, 0);
}

function collectAuditorWarnings(data: ValidatedParsedTicket): string[] {
  const warnings: string[] = [];
  const threshold = env.CALC_TOTAL_VARIANCE_THRESHOLD;
  const itemsSum = sumLineTotals(data.items);

  if (data.subtotal != null) {
    const rel = Math.abs(data.subtotal - itemsSum) / Math.max(data.subtotal, itemsSum, 1);
    if (rel > threshold) {
      warnings.push(
        `El subtotal impreso (${data.subtotal}) difiere de la suma de líneas (${itemsSum.toFixed(2)})`,
      );
    }
  }

  if (data.total != null && data.subtotal != null && data.tax != null) {
    const discount = data.discount ?? 0;
    const expected = data.subtotal + data.tax - discount;
    const rel = Math.abs(data.total - expected) / Math.max(data.total, expected, 1);
    if (rel > threshold) {
      warnings.push(
        `El total impreso (${data.total}) difiere de subtotal+impuesto-descuento (${expected.toFixed(2)})`,
      );
    }
  }

  const byKey = new Map<string, number>();
  for (const item of data.items) {
    const key = normalizeProductNameKey(item.name);
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  for (const [key, count] of byKey) {
    if (count > 1) {
      warnings.push(
        `Posible duplicado: "${key}" aparece ${count} veces; revisa si deben consolidarse`,
      );
    }
  }

  for (const item of data.items) {
    const qty = item.quantity ?? 1;
    if (qty > 50) {
      warnings.push(`Cantidad inusual (${qty}) en "${item.name}"; verifica manualmente`);
    }
  }

  return warnings;
}

function mergeWarnings(
  fromGemini: string[] | null | undefined,
  fromAuditor: string[],
): string[] | undefined {
  const merged = [...(fromGemini ?? []), ...fromAuditor];
  const unique = [...new Set(merged.map((w) => w.trim()).filter(Boolean))];
  return unique.length ? unique : undefined;
}

export function auditParsedTicket(raw: unknown): ParsedTicket {
  const parsed = parsedTicketSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      'No se pudo interpretar el ticket',
      'AI_PARSE_ERROR',
      422,
      parsed.error.flatten(),
    );
  }

  const data = parsed.data;
  const auditorWarnings = collectAuditorWarnings(data);
  const warnings = mergeWarnings(data.warnings, auditorWarnings);

  if (warnings?.length && process.env.NODE_ENV === 'development') {
    console.warn('[AiAuditor]', warnings);
  }

  const result: ParsedTicket = {
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

  if (warnings) result.warnings = warnings;
  if (data.confidence != null) result.confidence = data.confidence;
  if (data.parsingNotes) result.parsingNotes = data.parsingNotes;

  return result;
}
