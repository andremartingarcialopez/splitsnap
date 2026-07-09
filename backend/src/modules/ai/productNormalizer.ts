import { randomUUID } from 'node:crypto';
import type { ParsedTicket, ParsedTicketItem } from '../ocr/ocr.port';

export type RawParsedItem = ParsedTicketItem & {
  quantity?: number;
  indivisible?: boolean;
};

export type NormalizedProductLine = {
  name: string;
  unitPrice: number;
  confidenceScore: number | null;
  lineGroupId: string | null;
  isIndivisible: boolean;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function stripLeadingQuantity(name: string): { name: string; quantity: number } {
  const match = name.trim().match(/^(\d+)\s*[xX×]?\s+(.+)$/);
  if (match) {
    return { quantity: Number(match[1]), name: match[2]!.trim() };
  }
  return { quantity: 1, name: name.trim() };
}

/**
 * Convierte líneas agrupadas (ej. 3 Cervezas $300) en productos individuales ($100 c/u).
 * Respeta combos marcados como indivisibles.
 */
export function normalizeParsedItems(items: RawParsedItem[]): NormalizedProductLine[] {
  const result: NormalizedProductLine[] = [];

  for (const item of items) {
    const stripped = stripLeadingQuantity(item.name);
    const quantity = Math.max(1, Math.floor(item.quantity ?? stripped.quantity));
    const name = stripped.name || item.name.trim();
    const indivisible = Boolean(item.indivisible);

    if (!name || !(item.unitPrice > 0)) continue;

    if (indivisible || quantity <= 1) {
      result.push({
        name,
        unitPrice: roundMoney(item.unitPrice),
        confidenceScore: item.confidenceScore ?? null,
        lineGroupId: null,
        isIndivisible: indivisible,
      });
      continue;
    }

    const lineGroupId = randomUUID();
    const unitPrice = roundMoney(item.unitPrice / quantity);
    for (let i = 0; i < quantity; i++) {
      result.push({
        name,
        unitPrice,
        confidenceScore: item.confidenceScore ?? null,
        lineGroupId,
        isIndivisible: false,
      });
    }
  }

  return result;
}

/** Aplica normalización al ticket parseado por IA (subtotal coherente con ítems explotados). */
export function normalizeParsedTicket(parsed: ParsedTicket & { items: RawParsedItem[] }): ParsedTicket & {
  normalizedProducts: NormalizedProductLine[];
} {
  const normalizedProducts = normalizeParsedItems(parsed.items);
  if (!normalizedProducts.length) {
    return { ...parsed, items: [], normalizedProducts: [] };
  }

  const itemsSum = roundMoney(
    normalizedProducts.reduce((acc, p) => acc + p.unitPrice, 0),
  );

  return {
    ...parsed,
    items: normalizedProducts.map((p) => ({
      name: p.name,
      unitPrice: p.unitPrice,
      confidenceScore: p.confidenceScore,
    })),
    subtotal: parsed.subtotal ?? itemsSum,
    normalizedProducts,
  };
}
