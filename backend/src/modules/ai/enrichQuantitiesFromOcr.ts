import type { RawParsedItem } from './productNormalizer';
import {
  parseTicketLinesFromOcr,
  type OcrTicketLine,
} from '../ocr/ticketLineParser';

const PRICE_TOLERANCE = 0.05;

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\(\s*\d+\s*pz?\s*\)/gi, ' ')
    .replace(/\(\s*pza?\s*\)/gi, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const left = normalizeForMatch(a);
  const right = normalizeForMatch(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const leftWords = new Set(left.split(' ').filter(Boolean));
  const rightWords = new Set(right.split(' ').filter(Boolean));
  const intersection = [...leftWords].filter((w) => rightWords.has(w)).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return union > 0 ? intersection / union : 0;
}

function pricesAlign(
  item: RawParsedItem,
  line: OcrTicketLine,
  itemQty: number,
): boolean {
  const itemPrice = item.unitPrice;

  if (Math.abs(line.lineTotal - itemPrice) <= PRICE_TOLERANCE) return true;
  if (Math.abs(line.lineTotal - itemPrice * itemQty) <= PRICE_TOLERANCE) return true;
  if (
    line.quantity > 1 &&
    Math.abs(line.lineTotal / line.quantity - itemPrice) <= PRICE_TOLERANCE
  ) {
    return true;
  }
  return false;
}

function scoreMatch(
  item: RawParsedItem,
  line: OcrTicketLine,
  itemQty: number,
): number {
  const similarity = nameSimilarity(item.name, line.name);
  const priceMatch = pricesAlign(item, line, itemQty);
  if (!priceMatch && similarity < 0.25) return 0;
  if (!priceMatch && similarity < 0.85) return 0;
  return similarity + (priceMatch ? 0.5 : 0) + (line.quantity > 1 ? 0.1 : 0);
}

function findBestOcrLine(
  item: RawParsedItem,
  ocrLines: OcrTicketLine[],
  used: Set<number>,
): { line: OcrTicketLine; index: number } | null {
  const itemQty = item.quantity ?? 1;
  let best: { line: OcrTicketLine; index: number; score: number } | undefined;

  for (let index = 0; index < ocrLines.length; index++) {
    if (used.has(index)) continue;
    const line = ocrLines[index]!;
    const score = scoreMatch(item, line, itemQty);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { line, index, score };
    }
  }

  if (!best || best.score < 0.35) return null;
  return { line: best.line, index: best.index };
}

/** Fallback: match por precio exacto cuando nombre difiere levemente (OCR ruidoso). */
function findByPriceFallback(
  item: RawParsedItem,
  ocrLines: OcrTicketLine[],
  used: Set<number>,
): { line: OcrTicketLine; index: number } | null {
  const itemQty = item.quantity ?? 1;
  let best: { line: OcrTicketLine; index: number; score: number } | undefined;

  for (let index = 0; index < ocrLines.length; index++) {
    if (used.has(index)) continue;
    const line = ocrLines[index]!;
    if (!pricesAlign(item, line, itemQty)) continue;

    const similarity = nameSimilarity(item.name, line.name);
    if (similarity < 0.2) continue;

    const score = similarity + (line.quantity > 1 ? 0.2 : 0);
    if (!best || score > best.score) {
      best = { line, index, score };
    }
  }

  if (!best) return null;
  return { line: best.line, index: best.index };
}

function applyLineEnrichment(item: RawParsedItem, line: OcrTicketLine): RawParsedItem {
  const currentQty = Math.max(1, Math.floor(item.quantity ?? 1));
  const resolvedQty = Math.max(currentQty, line.quantity);
  const base = { ...item, indivisible: false };

  if (resolvedQty > 1 && currentQty <= 1) {
    return {
      ...base,
      quantity: resolvedQty,
      unitPrice: line.lineTotal,
    };
  }

  if (resolvedQty > 1 && currentQty === resolvedQty) {
    const asLineTotal = item.unitPrice * currentQty;
    if (
      Math.abs(asLineTotal - line.lineTotal) <= PRICE_TOLERANCE &&
      Math.abs(item.unitPrice - line.lineTotal) > PRICE_TOLERANCE
    ) {
      return { ...base, unitPrice: line.lineTotal };
    }
  }

  if (resolvedQty > 1 && currentQty !== resolvedQty) {
    return {
      ...base,
      quantity: resolvedQty,
      unitPrice: line.lineTotal,
    };
  }

  return item;
}

/**
 * Corrige quantity/unitPrice cuando la IA omite la columna CANT del OCR.
 * Si el OCR indica qty>1 con buen match, prevalece sobre indivisible=true de la IA.
 */
export function enrichQuantitiesFromOcr(
  items: RawParsedItem[],
  ocrText: string,
): RawParsedItem[] {
  const ocrLines = parseTicketLinesFromOcr(ocrText);
  if (!ocrLines.length) return items;

  const used = new Set<number>();
  const enriched: RawParsedItem[] = items.map((item) => {
    let match = findBestOcrLine(item, ocrLines, used);

    if (!match && item.indivisible) {
      match = findBestOcrLine({ ...item, indivisible: false }, ocrLines, used);
    }

    if (!match) {
      match = findByPriceFallback(item, ocrLines, used);
    }

    if (!match) return item;

    used.add(match.index);
    const { line } = match;

    if (item.indivisible && line.quantity <= 1) {
      return item;
    }

    return applyLineEnrichment(item, line);
  });

  return enriched;
}
