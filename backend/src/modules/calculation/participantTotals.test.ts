import { describe, expect, it } from 'vitest';
import { computeParticipantTotals } from './participantTotals';

describe('computeParticipantTotals', () => {
  it('reparte IVA y propina como el panel de control (Flan $80, IVA 16%, propina 10%)', () => {
    const rows = computeParticipantTotals({
      tax: 95.2,
      discount: 0,
      tipMode: 'GLOBAL',
      globalTipPercentage: 10,
      products: [
        {
          unitPrice: 515,
          assignments: [{ participantId: 'p1', shareRatio: 1 }],
        },
        {
          unitPrice: 80,
          assignments: [{ participantId: 'p2', shareRatio: 1 }],
        },
      ],
      ticketParticipants: [
        { id: 'tp1', participantId: 'p1', individualTipPercentage: null },
        { id: 'tp2', participantId: 'p2', individualTipPercentage: null },
      ],
    });

    const p2 = rows.find((row) => row.participantId === 'p2');
    expect(p2?.subtotal).toBe(80);
    expect(p2?.taxPortion).toBe(12.8);
    expect(p2?.tip).toBe(9.28);
    expect(p2?.total).toBe(102.08);
  });

  it('aplica shareRatio en productos compartidos', () => {
    const rows = computeParticipantTotals({
      tax: 95.2,
      discount: 0,
      tipMode: 'GLOBAL',
      globalTipPercentage: 10,
      products: [
        {
          unitPrice: 387.5,
          assignments: [{ participantId: 'p1', shareRatio: 1 }],
        },
        {
          unitPrice: 65,
          assignments: [
            { participantId: 'p1', shareRatio: 1 },
            { participantId: 'p2', shareRatio: 1 },
          ],
        },
        {
          unitPrice: 95,
          assignments: [{ participantId: 'p2', shareRatio: 1 }],
        },
        {
          unitPrice: 80,
          assignments: [{ participantId: 'p2', shareRatio: 1 }],
        },
      ],
      ticketParticipants: [
        { id: 'tp1', participantId: 'p1', individualTipPercentage: null },
        { id: 'tp2', participantId: 'p2', individualTipPercentage: null },
      ],
    });

    const p2 = rows.find((row) => row.participantId === 'p2');
    expect(p2?.subtotal).toBe(207.5);
    expect(p2?.taxPortion).toBe(31.48);
    expect(p2?.tip).toBe(23.9);
    expect(p2?.total).toBe(262.88);
  });
});
