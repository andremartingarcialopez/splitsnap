export type OcrTicketLine = {
  quantity: number;
  name: string;
  lineTotal: number;
  rawLine: string;
};

const SKIP_LINE =
  /^(cant|cantidad|descrip|descripcion|producto|importe|precio|subtotal|sub-total|total|iva|ieps|propina|fecha|mesa|ticket|folio|cliente|atendio|pago|efectivo|tarjeta|transferencia|rfc|tel|telefono|direccion|hora|fecha|consumo)\b/i;

const STANDALONE_QTY = /^(\d{1,2})$/;
const STANDALONE_PRICE = /^\$?\s*(\d+(?:[.,]\d{1,2})?)\s*$/;
const HEADER_NOISE =
  /^(cant|descrip|descripcion|consumo|={2,}|-{2,}|total|descripci[oó]n)$/i;

function parseMoney(token: string): number | null {
  const normalized = token.replace(/[$,\s]/g, '').replace(',', '.');
  const match = normalized.match(/^(\d+(?:\.\d{1,2})?)$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]!);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function cleanProductName(name: string): string {
  return name
    .replace(/\s*-\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normaliza guiones/spaces antes del precio al final de línea. */
export function normalizeTicketLine(line: string): string {
  return line
    .replace(/\s*-\s*(?=\$?\s*\d+(?:[.,]\d{1,2})?\s*$)/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function isSkippableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return true;
  return SKIP_LINE.test(trimmed);
}

function isValidProductName(name: string): boolean {
  const cleaned = cleanProductName(name);
  if (cleaned.length < 3) return false;
  if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(cleaned)) return false;
  if (SKIP_LINE.test(cleaned)) return false;
  if (STANDALONE_QTY.test(cleaned)) return false;
  if (HEADER_NOISE.test(cleaned)) return false;
  return true;
}

function parseStandaloneQty(line: string): number | null {
  const match = line.trim().match(STANDALONE_QTY);
  if (!match) return null;
  const qty = Number.parseInt(match[1]!, 10);
  return qty >= 1 && qty <= 99 ? qty : null;
}

function parseStandalonePrice(line: string): number | null {
  const trimmed = line.trim();
  const match = trimmed.match(STANDALONE_PRICE);
  if (!match) return null;
  const price = parseMoney(match[1]!);
  if (price == null) return null;
  // Evitar confundir cantidades 1-9 sueltas con precios
  if (price < 10 && !trimmed.includes('$') && !/[.,]\d{1,2}/.test(trimmed)) {
    return null;
  }
  return price;
}

function buildLine(
  quantity: number,
  name: string,
  lineTotal: number | null,
  rawLine: string,
): OcrTicketLine | null {
  if (lineTotal == null) return null;
  const cleanedName = cleanProductName(name);
  if (quantity < 1 || quantity > 99 || !isValidProductName(cleanedName)) return null;
  return { quantity, name: cleanedName, lineTotal, rawLine };
}

function normalizeForDedup(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isDuplicate(existing: OcrTicketLine[], candidate: OcrTicketLine): boolean {
  return existing.some(
    (r) =>
      r.quantity === candidate.quantity &&
      r.lineTotal === candidate.lineTotal &&
      normalizeForDedup(r.name) === normalizeForDedup(candidate.name),
  );
}

function findConsumoBounds(rawLines: string[]): { start: number; end: number } | null {
  const start = rawLines.findIndex((l) => /consumo|cant\.?\s*descrip/i.test(l));
  if (start < 0) return null;
  const end = rawLines.findIndex(
    (l, i) => i > start && /sub-?total|i\.?\s*v\.?\s*a\.?|total a pagar/i.test(l),
  );
  return { start, end: end >= 0 ? end : rawLines.length };
}

/** Precios de ítems en bloque inferior ($180, $110… antes del subtotal). */
function extractItemPriceBlock(rawLines: string[]): number[] {
  const prices: number[] = [];
  let inBlock = false;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (/^total\s*$/i.test(trimmed) || /^={2,}$/.test(trimmed)) {
      inBlock = true;
      continue;
    }

    const price = parseStandalonePrice(trimmed);
    if (!price) {
      if (inBlock && prices.length > 0) break;
      continue;
    }

    if (!inBlock) continue;

    if (prices.length >= 2) {
      const sum = prices.reduce((acc, value) => acc + value, 0);
      if (Math.abs(price - sum) <= 1 || price >= 500) break;
    }

    prices.push(price);
    if (prices.length >= 30) break;
  }

  return prices;
}

/** Bloque inicial de cantidades sueltas (2, 1, 1, 2, 1) antes de los nombres. */
function extractQtyRun(lines: string[]): number[] {
  const qtyRun: number[] = [];
  for (const line of lines) {
    if (HEADER_NOISE.test(line.trim()) || isSkippableLine(line)) continue;
    const qty = parseStandaloneQty(line);
    if (qty != null) {
      qtyRun.push(qty);
      continue;
    }
    if (qtyRun.length > 0 && isValidProductName(line)) break;
  }
  return qtyRun;
}

/** Nombres de producto en la sección CONSUMO con cantidad previa si existe. */
function extractConsumoNames(
  lines: string[],
): Array<{ name: string; quantity: number; index: number }> {
  const entries: Array<{ name: string; quantity: number; index: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (HEADER_NOISE.test(line.trim()) || isSkippableLine(line)) continue;
    if (parseStandaloneQty(line) != null) continue;
    if (parseStandalonePrice(line) != null) continue;
    if (!isValidProductName(line)) continue;

    const prevQty = i > 0 ? parseStandaloneQty(lines[i - 1]!) : null;
    entries.push({
      name: cleanProductName(line),
      quantity: prevQty ?? 1,
      index: i,
    });
  }

  return entries;
}

/**
 * Parser para tickets con columnas OCR desalineadas:
 * nombres arriba, precios abajo, cantidades sueltas.
 */
export function parseColumnarTicketFromOcr(ocrText: string): OcrTicketLine[] {
  const rawLines = ocrText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const bounds = findConsumoBounds(rawLines);
  if (!bounds) return [];

  const consumoLines = rawLines.slice(bounds.start, bounds.end);
  const names = extractConsumoNames(consumoLines);
  const prices = extractItemPriceBlock(rawLines);
  if (!names.length || !prices.length) return [];

  const qtyRun = extractQtyRun(consumoLines);
  const count = Math.min(names.length, prices.length);
  const results: OcrTicketLine[] = [];

  for (let i = 0; i < count; i++) {
    const entry = names[i]!;
    const price = prices[i]!;
    let quantity = entry.quantity;

    if (qtyRun.length === count) {
      quantity = qtyRun[i]!;
    } else if (qtyRun.length === 1 && i === 0) {
      quantity = qtyRun[0]!;
    }

    const line = buildLine(
      quantity,
      entry.name,
      price,
      `columnar: ${quantity} ${entry.name} ${price}`,
    );
    if (line && !isDuplicate(results, line)) results.push(line);
  }

  return results;
}

/** Reconstruye líneas legibles para Gemini cuando el OCR desalineó columnas. */
export function buildStructuredOcrForAi(ocrText: string): string {
  const columnLines = parseColumnarTicketFromOcr(ocrText);
  if (!columnLines.length) return ocrText;

  const list = columnLines
    .map((l, i) => `${i + 1}. ${l.name} — importe $${l.lineTotal.toFixed(2)}`)
    .join('\n');

  return `${ocrText}\n\n--- PRODUCTOS DETECTADOS (orden del ticket, columnas OCR) ---\n${list}\n\nAsigna quantity (CANT) a cada producto en ese orden usando el texto OCR original. unitPrice = importe total de la línea cuando quantity>1.`;
}

/** Extrae líneas tipo CANT | DESCRIPCIÓN | IMPORTE de una sola línea OCR. */
export function parseTicketLine(line: string): OcrTicketLine | null {
  const trimmed = normalizeTicketLine(line);
  if (!trimmed || trimmed.length < 4 || isSkippableLine(trimmed)) return null;

  const strict = trimmed.match(/^(\d{1,2})\s+(.+?)\s+\$?\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
  if (strict) {
    const quantity = Number.parseInt(strict[1]!, 10);
    const name = cleanProductName(strict[2]!);
    const lineTotal = parseMoney(strict[3]!);
    return buildLine(quantity, name, lineTotal, trimmed);
  }

  const endPrice = trimmed.match(/(\d+(?:[.,]\d{1,2})?)\s*$/);
  const startQty = trimmed.match(/^(\d{1,2})\s+/);
  if (!endPrice || !startQty) return null;

  const quantity = Number.parseInt(startQty[1]!, 10);
  const lineTotal = parseMoney(endPrice[1]!);
  const name = cleanProductName(
    trimmed.slice(startQty[0].length, trimmed.length - endPrice[0].length),
  );

  return buildLine(quantity, name, lineTotal, trimmed);
}

function stitchMultilineEntries(
  rawLines: string[],
  consumed: Set<number>,
): OcrTicketLine[] {
  const result: OcrTicketLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    if (consumed.has(i)) continue;

    const qty = parseStandaloneQty(rawLines[i]!);
    if (qty == null) continue;

    if (i + 2 < rawLines.length && !consumed.has(i + 1) && !consumed.has(i + 2)) {
      const nameLine = rawLines[i + 1]!;
      const lineTotal = parseStandalonePrice(rawLines[i + 2]!);
      const stitched = buildLine(
        qty,
        nameLine,
        lineTotal,
        `${rawLines[i]} | ${nameLine} | ${rawLines[i + 2]}`,
      );
      if (stitched && !isDuplicate(result, stitched)) {
        result.push(stitched);
        consumed.add(i);
        consumed.add(i + 1);
        consumed.add(i + 2);
        continue;
      }
    }

    if (i + 1 < rawLines.length && !consumed.has(i + 1)) {
      const nextLine = rawLines[i + 1]!;
      const combined = parseTicketLine(`${qty} ${normalizeTicketLine(nextLine)}`);
      if (combined) {
        const stitched = { ...combined, rawLine: `${rawLines[i]} | ${nextLine}` };
        if (!isDuplicate(result, stitched)) {
          result.push(stitched);
          consumed.add(i);
          consumed.add(i + 1);
          continue;
        }
      }

      const inlinePrice = nextLine.match(/(.+?)\s+\$?\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
      if (inlinePrice) {
        const stitched = buildLine(
          qty,
          inlinePrice[1]!,
          parseMoney(inlinePrice[2]!),
          `${rawLines[i]} | ${nextLine}`,
        );
        if (stitched && !isDuplicate(result, stitched)) {
          result.push(stitched);
          consumed.add(i);
          consumed.add(i + 1);
        }
      }
    }
  }

  return result;
}

export function parseTicketLinesFromOcr(ocrText: string): OcrTicketLine[] {
  const rawLines = ocrText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const results: OcrTicketLine[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < rawLines.length; i++) {
    const parsed = parseTicketLine(rawLines[i]!);
    if (parsed && !isDuplicate(results, parsed)) {
      results.push(parsed);
      consumed.add(i);
    }
  }

  results.push(...stitchMultilineEntries(rawLines, consumed));

  if (results.length === 0) {
    for (const line of parseColumnarTicketFromOcr(ocrText)) {
      if (!isDuplicate(results, line)) results.push(line);
    }
  } else if (results.length < 3) {
    for (const line of parseColumnarTicketFromOcr(ocrText)) {
      if (!isDuplicate(results, line)) results.push(line);
    }
  }

  return results;
}
