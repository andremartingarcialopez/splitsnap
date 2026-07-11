export type OcrTicketLine = {
  quantity: number;
  name: string;
  lineTotal: number;
  rawLine: string;
};

const SKIP_LINE =
  /^(cant|cantidad|descrip|descripcion|producto|importe|precio|subtotal|total|iva|ieps|propina|fecha|mesa|ticket|folio|cliente|atendio|pago|efectivo|tarjeta|transferencia)\b/i;

function parseMoney(token: string): number | null {
  const normalized = token.replace(/[$,\s]/g, '').replace(',', '.');
  const match = normalized.match(/^(\d+(?:\.\d{1,2})?)$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]!);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Extrae líneas tipo CANT | DESCRIPCIÓN | IMPORTE del texto OCR. */
export function parseTicketLine(line: string): OcrTicketLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4 || SKIP_LINE.test(trimmed)) return null;

  const strict = trimmed.match(/^(\d{1,2})\s+(.+?)\s+\$?\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
  if (strict) {
    const quantity = Number.parseInt(strict[1]!, 10);
    const name = strict[2]!.trim();
    const lineTotal = parseMoney(strict[3]!);
    if (quantity >= 1 && quantity <= 99 && name.length >= 2 && lineTotal != null) {
      return { quantity, name, lineTotal, rawLine: trimmed };
    }
  }

  const endPrice = trimmed.match(/(\d+(?:[.,]\d{1,2})?)\s*$/);
  const startQty = trimmed.match(/^(\d{1,2})\s+/);
  if (!endPrice || !startQty) return null;

  const quantity = Number.parseInt(startQty[1]!, 10);
  const lineTotal = parseMoney(endPrice[1]!);
  const name = trimmed
    .slice(startQty[0].length, trimmed.length - endPrice[0].length)
    .trim()
    .replace(/\s+/g, ' ');

  if (quantity < 1 || quantity > 99 || name.length < 2 || lineTotal == null) return null;

  return { quantity, name, lineTotal, rawLine: trimmed };
}

export function parseTicketLinesFromOcr(ocrText: string): OcrTicketLine[] {
  const lines: OcrTicketLine[] = [];
  for (const rawLine of ocrText.split('\n')) {
    const parsed = parseTicketLine(rawLine);
    if (parsed) lines.push(parsed);
  }
  return lines;
}
