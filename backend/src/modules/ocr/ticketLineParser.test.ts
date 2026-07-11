import { describe, expect, it } from 'vitest';
import {
  buildStructuredOcrForAi,
  normalizeTicketLine,
  parseTicketLine,
  parseColumnarTicketFromOcr,
  parseTicketLinesFromOcr,
} from './ticketLineParser';

describe('parseTicketLine', () => {
  it('parses CANT | producto | importe', () => {
    expect(parseTicketLine('5 Cerveza tecate 500')).toEqual({
      quantity: 5,
      name: 'Cerveza tecate',
      lineTotal: 500,
      rawLine: '5 Cerveza tecate 500',
    });
  });

  it('parses single quantity lines', () => {
    expect(parseTicketLine('1 Camarones 400.00')).toMatchObject({
      quantity: 1,
      name: 'Camarones',
      lineTotal: 400,
    });
  });

  it('parses lines with dollar sign and dash before price', () => {
    expect(parseTicketLine('2 CERVEZA PACÍFICO - $130.00')).toMatchObject({
      quantity: 2,
      name: 'CERVEZA PACÍFICO',
      lineTotal: 130,
    });
  });

  it('parses El Sol de México taco line', () => {
    expect(parseTicketLine('2 TACOS AL PASTOR (4pz) $180.00')).toMatchObject({
      quantity: 2,
      name: 'TACOS AL PASTOR (4pz)',
      lineTotal: 180,
    });
  });

  it('ignores header rows', () => {
    expect(parseTicketLine('CANT DESCRIPCION IMPORTE')).toBeNull();
    expect(parseTicketLine('SUBTOTAL 1000')).toBeNull();
    expect(parseTicketLine('SUB-TOTAL ITEMS $595.00')).toBeNull();
  });
});

describe('parseTicketLinesFromOcr', () => {
  it('extracts multiple product lines from ticket text', () => {
    const ocr = `
RESTAURANTE EL SOL
CANT DESCRIPCION IMPORTE
1 Camarones 400
5 Cerveza tecate 500
1 Flan de chocolate 100
SUBTOTAL 1000
`;
    const lines = parseTicketLinesFromOcr(ocr);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatchObject({ quantity: 5, lineTotal: 500 });
  });

  it('stitches split OCR columns (qty / name / price)', () => {
    const ocr = `
2
CERVEZA PACÍFICO
130.00
1
FLAN CASERO
80.00
`;
    const lines = parseTicketLinesFromOcr(ocr);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      quantity: 2,
      name: 'CERVEZA PACÍFICO',
      lineTotal: 130,
    });
    expect(lines[1]).toMatchObject({ quantity: 1, lineTotal: 80 });
  });

  it('stitches qty line + name with inline price', () => {
    const ocr = `
2
CERVEZA PACÍFICO $130.00
`;
    const lines = parseTicketLinesFromOcr(ocr);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ quantity: 2, lineTotal: 130 });
  });

  it('parses full El Sol de México ticket', () => {
    const ocr = `
EL SOL DE MÉXICO
CANT. DESCRIPCIÓN TOTAL
2 TACOS AL PASTOR (4pz) $180.00
1 QUESADILLA DE HUITLACOCHE $110.00
1 CHICHARRÓN DE QUESO $95.00
2 CERVEZA PACÍFICO $130.00
1 FLAN CASERO (Pza) $80.00
SUB-TOTAL ITEMS $595.00
`;
    const lines = parseTicketLinesFromOcr(ocr);
    expect(lines).toHaveLength(5);
    expect(lines.find((l) => l.name.includes('CERVEZA'))).toMatchObject({
      quantity: 2,
      lineTotal: 130,
    });
    expect(lines.find((l) => l.name.includes('TACOS'))).toMatchObject({
      quantity: 2,
      lineTotal: 180,
    });
  });

  it('parses misaligned OCR columns (names top, prices bottom)', () => {
    const ocr = `
CONSUMO:
CANT
DESCRIPCIÓN
2
TACOS AL PASTOR (4pz)
QUESADILLA DE HUITLACOCHE
CHICHARRÓN DE QUESO
CERVEZA PACÍFICO
FLAN CASERO (Pza)
SUB-TOTAL ITEMS:
TOTAL
$180.00
$110.0
$95.00
$130.00
$80.00
$595.00
`;
    const lines = parseColumnarTicketFromOcr(ocr);
    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatchObject({ quantity: 2, lineTotal: 180, name: 'TACOS AL PASTOR (4pz)' });
    expect(lines[3]).toMatchObject({ lineTotal: 130, name: 'CERVEZA PACÍFICO' });
    expect(parseTicketLinesFromOcr(ocr).length).toBeGreaterThanOrEqual(5);
  });

  it('buildStructuredOcrForAi adds product list hint', () => {
    const ocr = `CONSUMO:\n2\nTACOS AL PASTOR\nCERVEZA\nSUB-TOTAL\nTOTAL\n$180\n$130\n$595`;
    const structured = buildStructuredOcrForAi(ocr);
    expect(structured).toContain('PRODUCTOS DETECTADOS');
    expect(structured).toContain('TACOS');
  });
});

describe('normalizeTicketLine', () => {
  it('removes dash before trailing price', () => {
    expect(normalizeTicketLine('2 Cerveza - $130')).toBe('2 Cerveza $130');
  });
});
