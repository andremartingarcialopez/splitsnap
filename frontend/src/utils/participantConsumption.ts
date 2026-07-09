import type { Product } from '../types/domain';

export type ParticipantProductLine = {
  productId: string;
  name: string;
  amount: number;
  /** Porcentaje del producto, ej. "50%" si lo compartió */
  shareLabel: string | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Líneas de consumo de un participante a partir de asignaciones del ticket (MDD §5.1). */
export function getParticipantProductLines(
  products: Product[],
  participantId: string,
): ParticipantProductLine[] {
  const lines: ParticipantProductLine[] = [];

  for (const product of products) {
    const assignees = product.assignments ?? [];
    const assignment = assignees.find((a) => a.participantId === participantId);
    if (!assignment || assignees.length === 0) continue;

    const shareSum = assignees.reduce((acc, a) => acc + a.shareRatio, 0);
    if (shareSum <= 0) continue;

    const amount = round2(product.unitPrice * (assignment.shareRatio / shareSum));
    const isShared = assignees.length > 1;
    const sharePct = Math.round((assignment.shareRatio / shareSum) * 100);

    lines.push({
      productId: product.id,
      name: product.name,
      amount,
      shareLabel: isShared ? `${sharePct}%` : null,
    });
  }

  return lines;
}
