import { showSuccessToast } from '../utils/toast';
import {
  buildSummaryShareText,
  copySummaryText,
  whatsAppShareUrl,
} from '../utils/shareSummary';
import type { HistoryDetail } from '../types/domain';

type Props = {
  detail: HistoryDetail;
};

export function ShareSummaryActions({ detail }: Props) {
  const text = buildSummaryShareText(detail);

  async function handleCopy() {
    const ok = await copySummaryText(text);
    showSuccessToast(ok ? 'Resumen copiado' : 'No se pudo copiar');
  }

  function handleWhatsApp() {
    window.open(whatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-secondary text-sm" onClick={() => void handleCopy()}>
        Copiar resumen
      </button>
      <button type="button" className="btn-primary text-sm" onClick={handleWhatsApp}>
        Compartir por WhatsApp
      </button>
    </div>
  );
}
