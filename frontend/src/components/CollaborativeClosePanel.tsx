import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from './Alert';
import { GlobalTipSelector } from './GlobalTipSelector';
import { ParticipantConsumptionModal } from './ParticipantConsumptionModal';
import { Spinner } from './Spinner';
import { ApiClientError, ticketsApi } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';
import type { Product, TicketParticipantLink, TicketSummary } from '../types/domain';
import { formatMoney } from '../utils/money';
import { showSuccessToast } from '../utils/toast';

type Props = {
  ticketId: string;
  sessionStatus?: string;
  refreshKey?: number;
  onChanged?: () => void;
  /** Productos del ticket (ya cargados en el panel de control). */
  products?: Product[];
  ticketParticipants?: TicketParticipantLink[];
};

export function CollaborativeClosePanel({
  ticketId,
  sessionStatus,
  refreshKey = 0,
  onChanged,
  products = [],
  ticketParticipants,
}: Props) {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [globalTip, setGlobalTip] = useState(10);
  const [selectedTpId, setSelectedTpId] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setStatus('loading');
      setError(null);
    }
    try {
      const data = await ticketsApi.getSummary(ticketId);
      setSummary(data);
      setGlobalTip(data.globalTipPercentage ?? 10);
      setStatus('ready');
    } catch (err) {
      if (silent) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el resumen.');
      } else {
        setStatus('error');
        setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el resumen.');
      }
    }
  }, [ticketId]);

  useEffect(() => {
    // refreshKey > 0: actualización en segundo plano sin colapsar la sección
    void load({ silent: refreshKey > 0 });
  }, [load, refreshKey]);

  if (status === 'loading' && !summary) {
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
      await load({ silent: true });
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el pago.');
    } finally {
      setBusyId(null);
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
  const selectedParticipant =
    summary.participants.find((p) => p.ticketParticipantId === selectedTpId) ?? null;
  const canShowConsumption = products.length > 0;

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

      <div className="space-y-2 rounded-2xl border border-border bg-surface-muted/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
        <div>
          <p className="text-sm font-medium text-foreground dark:text-white">Propina global</p>
          <p className="text-xs text-foreground-muted dark:text-slate-400">
            Acordada al iniciar la división (referencia del restaurante). No se puede modificar aquí.
          </p>
        </div>
        <GlobalTipSelector value={globalTip} readOnly />
      </div>

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
              <button
                type="button"
                className={[
                  'min-w-0 flex-1 text-left',
                  canShowConsumption ? 'cursor-pointer rounded-xl transition hover:opacity-80' : '',
                ].join(' ')}
                disabled={!canShowConsumption}
                onClick={() => canShowConsumption && setSelectedTpId(tpId)}
              >
                <p className="font-semibold text-foreground dark:text-white">
                  {p.name || 'Participante'}
                </p>
                <p className="text-sm text-foreground-muted">
                  Subtotal {formatMoney(p.subtotal)} · Propina {formatMoney(p.tip)}
                </p>
                {canShowConsumption && (
                  <p className="mt-1 text-xs text-primary dark:text-primary-light">
                    Ver consumo
                  </p>
                )}
              </button>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="text-lg font-bold text-primary dark:text-primary-light">
                  {formatMoney(p.total)}
                </p>
                {sessionStatus !== 'FINISHED' && (
                  <button
                    type="button"
                    className={
                      isPaid
                        ? 'btn-secondary btn-sm'
                        : 'btn-sm min-h-[36px] rounded-pill border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950/70'
                    }
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

      <ParticipantConsumptionModal
        open={selectedParticipant != null}
        participant={selectedParticipant}
        products={products}
        ticketParticipants={ticketParticipants}
        sessionStatus={sessionStatus}
        busyId={busyId}
        onClose={() => setSelectedTpId(null)}
        onTogglePayment={(id, current) => void togglePayment(id, current)}
      />
    </section>
  );
}
