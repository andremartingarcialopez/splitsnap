import type { RawParsedItem } from './productNormalizer';
import {
  parseTicketLinesFromOcr,
  type OcrTicketLine,
} from '../ocr/ticketLineParser';

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\(\s*\d+\s*pz?\s*\)/gi, ' ')
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
  const tolerance = 0.05;
  const itemPrice = item.unitPrice;

  if (Math.abs(line.lineTotal - itemPrice) <= tolerance) return true;
  if (Math.abs(line.lineTotal - itemPrice * itemQty) <= tolerance) return true;
  if (
    line.quantity > 1 &&
    Math.abs(line.lineTotal / line.quantity - itemPrice) <= tolerance
  ) {
    return true;
  }
  return false;
}

function findBestOcrLine(
  item: RawParsedItem,
  ocrLines: OcrTicketLine[],
  used: Set<number>,
): { line: OcrTicketLine; index: number } | null {
  const itemQty = item.quantity ?? 1;
  let best: { line: OcrTicketLine; index: number; score: number } | undefined;

  for (let index = 0; index < ocrLines.length; index++) {
    const line = ocrLines[index]!;
    if (used.has(index)) continue;

    const similarity = nameSimilarity(item.name, line.name);
    if (similarity < 0.35) continue;

    const priceMatch = pricesAlign(item, line, itemQty);
    if (!priceMatch && similarity < 0.85) continue;

    const score = similarity + (priceMatch ? 0.4 : 0);
    if (!best || score > best.score) {
      best = { line, index, score };
    }
  }

  if (!best) return null;
  return { line: best.line, index: best.index };
}

/** Corrige quantity/unitPrice cuando la IA omite la columna CANT del OCR. */
export function enrichQuantitiesFromOcr(
  items: RawParsedItem[],
  ocrText: string,
): RawParsedItem[] {
  const ocrLines = parseTicketLinesFromOcr(ocrText);
  if (!ocrLines.length) return items;

  const used = new Set<number>();

  return items.map((item) => {
    if (item.indivisible) return item;

    const match = findBestOcrLine(item, ocrLines, used);
    if (!match) return item;

    used.add(match.index);
    const { line } = match;
    const currentQty = Math.max(1, Math.floor(item.quantity ?? 1));

    if (line.quantity > 1 && currentQty <= 1) {
      return {
        ...item,
        quantity: line.quantity,
        unitPrice: line.lineTotal,
      };
    }

    if (line.quantity > 1 && currentQty === line.quantity) {
      const asLineTotal = item.unitPrice * currentQty;
      if (
        Math.abs(asLineTotal - line.lineTotal) <= 0.05 &&
        Math.abs(item.unitPrice - line.lineTotal) > 0.05
      ) {
        return { ...item, unitPrice: line.lineTotal };
      }
    }

    return item;
  });
}
