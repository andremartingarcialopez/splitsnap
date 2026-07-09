import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from './Alert';
import { GlobalTipSelector } from './GlobalTipSelector';
import { Spinner } from './Spinner';
import { ApiClientError, ticketsApi } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';
import type { TicketSummary } from '../types/domain';
import { formatMoney } from '../utils/money';
import { showSuccessToast } from '../utils/toast';

type Props = {
  ticketId: string;
  sessionStatus?: string;
  refreshKey?: number;
  onChanged?: () => void;
};

export function CollaborativeClosePanel({
  ticketId,
  sessionStatus,
  refreshKey = 0,
  onChanged,
}: Props) {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [globalTip, setGlobalTip] = useState(10);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await ticketsApi.getSummary(ticketId);
      setSummary(data);
      setGlobalTip(data.globalTipPercentage ?? 10);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el resumen.');
    }
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (status === 'loading') {
    return (
      <section className="card">
        <Spinner label="Calculando resumen…" />
      </section>
    );
  }

  if (status === 'error' || !summary) {
    return (
      <section className="card space-y-3">
        <Alert tone="error">{error || 'Sin resumen'}</Alert>
        <button type="button" className="btn-secondary" onClick={() => void load()}>
          Reintentar
        </button>
      </section>
    );
  }

  async function togglePayment(ticketParticipantId: string, current: string | undefined) {
    setBusyId(ticketParticipantId);
    setError(null);
    try {
      await ticketsApi.updatePaymentStatus(
        ticketId,
        ticketParticipantId,
        current === 'PAID' ? 'PENDING' : 'PAID',
      );
      showSuccessToast(current === 'PAID' ? 'Marcado como pendiente' : 'Marcado como pagado');
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el pago.');
    } finally {
      setBusyId(null);
    }
  }

  async function saveTip(value: number) {
    setGlobalTip(value);
    setError(null);
    try {
      await ticketsApi.updateCollaborationSettings(ticketId, { globalTipPercentage: value });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar la propina.');
    }
  }

  async function finalize() {
    if (!summary?.canClose) return;
    const ok = await confirm({
      title: 'Cerrar ticket',
      message: '¿Cerrar este ticket? Pasará al historial y nadie podrá modificarlo.',
      confirmLabel: 'Cerrar ticket',
    });
    if (!ok) return;
    setFinalizing(true);
    setError(null);
    try {
      await ticketsApi.finalize(ticketId);
      onChanged?.();
      navigate(`/history/${ticketId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cerrar el ticket.');
    } finally {
      setFinalizing(false);
    }
  }

  const paidCount = summary.participants.filter((p) => p.paymentStatus === 'PAID').length;

  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground dark:text-white">Resumen y cobros</h2>
          <p className="text-sm text-foreground-muted dark:text-slate-400">
            Marca quién ya te pagó fuera de la app.
          </p>
        </div>
        {sessionStatus !== 'FINISHED' && (
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={!summary.canClose || finalizing}
            onClick={() => void finalize()}
          >
            {finalizing ? 'Cerrando…' : 'Cerrar ticket'}
          </button>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {sessionStatus === 'REVIEWING' && (
        <Alert tone="info">
          Todos terminaron su selección. Revisa montos, marca pagos y cierra cuando estén al día.
        </Alert>
      )}

      {!summary.canClose && sessionStatus !== 'FINISHED' && (
        <Alert tone="warning">
          {!summary.allParticipantsCompleted
            ? 'Falta que todos completen su selección.'
            : !summary.allParticipantsPaid
              ? `Pagos pendientes: ${paidCount} de ${summary.participants.length} marcados como pagados.`
              : summary.unassignedProducts.length > 0
                ? `Hay ${summary.unassignedProducts.length} producto(s) sin asignar.`
                : 'Revisa el ticket antes de cerrar.'}
        </Alert>
      )}

      {summary.varianceWarning && summary.varianceAmount != null && (
        <Alert tone="warning">
          El total calculado ({formatMoney(summary.grandTotal)}) difiere del ticket (
          {formatMoney(summary.ticketTotal)}) por {formatMoney(summary.varianceAmount)}.
        </Alert>
      )}

      {sessionStatus === 'REVIEWING' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground dark:text-white">Propina global</p>
          <GlobalTipSelector value={globalTip} onChange={(value) => void saveTip(value)} />
        </div>
      )}

      <ul className="space-y-2">
        {summary.participants.map((p) => {
          const tpId = p.ticketParticipantId;
          if (!tpId) return null;
          const isPaid = p.paymentStatus === 'PAID';
          return (
            <li
              key={tpId}
              className="flex flex-col gap-3 rounded-2xl bg-surface-muted px-4 py-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground dark:text-white">
                  {p.name || 'Participante'}
                </p>
                <p className="text-sm text-foreground-muted">
                  Subtotal {formatMoney(p.subtotal)} · Propina {formatMoney(p.tip)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="text-lg font-bold text-primary dark:text-primary-light">
                  {formatMoney(p.total)}
                </p>
                {sessionStatus !== 'FINISHED' && (
                  <button
                    type="button"
                    className={isPaid ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
                    disabled={busyId === tpId}
                    onClick={() => void togglePayment(tpId, p.paymentStatus)}
                  >
                    {busyId === tpId ? '…' : isPaid ? '✓ Pagado' : 'Pendiente'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-3 dark:border-slate-800">
        <span className="text-sm text-foreground-muted">Total del grupo</span>
        <span className="text-xl font-bold text-primary dark:text-primary-light">
          {formatMoney(summary.grandTotal)}
        </span>
      </div>
    </section>
  );
}
