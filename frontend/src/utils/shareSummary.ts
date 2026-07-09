import type { HistoryDetail } from '../types/domain';
import { formatMoney } from './money';

export function buildSummaryShareText(detail: HistoryDetail): string {
  const { ticket, summary } = detail;
  const title = ticket.restaurantName || ticket.title;
  const lines = [
    `🍽️ SplitSnap — ${title}`,
    '',
    ...summary.participants.map(
      (p) => `• ${p.name || 'Participante'}: ${formatMoney(p.total)}`,
    ),
    '',
    `Total del grupo: ${formatMoney(summary.grandTotal)}`,
  ];
  return lines.join('\n');
}

export async function copySummaryText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
