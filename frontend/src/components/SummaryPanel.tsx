import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from './Alert';
import { Spinner } from './Spinner';
import { ApiClientError, ticketsApi } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';
import type { TicketSummary } from '../types/domain';

function money(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);
}

type SummaryPanelProps = {
  ticketId: string;
  refreshKey?: number;
  isFinalized?: boolean;
  onFinalized?: () => void;
};

export function SummaryPanel({
  ticketId,
  refreshKey = 0,
  isFinalized = false,
  onFinalized,
}: SummaryPanelProps) {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setStatus('loading');
      setError(null);
    }
    try {
      const data = await ticketsApi.getSummary(ticketId);
      setSummary(data);
      setStatus('ready');
    } catch (err) {
      if (silent) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el resumen.');
      } else {
        setStatus('error');
        setError(err instanceof ApiClientError ? err.message : 'No se pudo calcular.');
      }
    }
  }, [ticketId]);

  useEffect(() => {
    void load({ silent: refreshKey > 0 });
  }, [load, refreshKey]);

  async function recalculate() {
    setRecalculating(true);
    try {
      const data = await ticketsApi.calculate(ticketId);
      setSummary(data);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al recalcular.');
    } finally {
      setRecalculating(false);
    }
  }

  async function finalize() {
    if (!summary?.canFinalize) return;
    const ok = await confirm({
      title: 'Finalizar ticket',
      message: '¿Finalizar este ticket? Pasará al historial y no podrás editarlo desde aquí.',
      confirmLabel: 'Finalizar',
    });
    if (!ok) return;
    setFinalizing(true);
    setError(null);
    try {
      await ticketsApi.finalize(ticketId);
      onFinalized?.();
      navigate(`/history/${ticketId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo finalizar.');
    } finally {
      setFinalizing(false);
    }
  }

  if (status === 'loading' && !summary) {
    return (
      <section className="card">
        <Spinner label="Calculando división…" />
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

  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground dark:text-white">Resumen de división</h2>
        <div className="flex flex-wrap gap-2">
          {!isFinalized && (
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={!summary.canFinalize || finalizing}
              onClick={() => void finalize()}
            >
              {finalizing ? 'Finalizando…' : 'Finalizar ticket'}
            </button>
          )}
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={recalculating || isFinalized}
            onClick={() => void recalculate()}
          >
            {recalculating ? 'Recalculando…' : 'Recalcular'}
          </button>
        </div>
      </div>

      {isFinalized && (
        <Alert tone="info">
          Este ticket ya está finalizado.{' '}
          <Link to={`/history/${ticketId}`} className="underline">
            Ver en historial
          </Link>
        </Alert>
      )}

      {!summary.canFinalize && (
        <Alert tone="warning">
          No se puede finalizar:{' '}
          {summary.unassignedProducts.length > 0
            ? `hay ${summary.unassignedProducts.length} producto(s) sin asignar (${summary.unassignedProducts.map((p) => p.name).join(', ')}).`
            : 'verifica participantes y productos.'}
        </Alert>
      )}

      {summary.varianceWarning && summary.varianceAmount != null && (
        <Alert tone="warning">
          El total calculado ({money(summary.grandTotal)}) difiere del impreso (
          {money(summary.ticketTotal)}) por {money(summary.varianceAmount)}. Revisa
          productos o montos del ticket.
        </Alert>
      )}

      {summary.participants.length === 0 ? (
        <p className="text-sm text-muted">Añade participantes para ver la división.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-foreground-muted dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-3 font-normal">Persona</th>
                <th className="py-2 pr-3 font-normal">Subtotal</th>
                <th className="py-2 pr-3 font-normal">IVA</th>
                <th className="py-2 pr-3 font-normal">Desc.</th>
                <th className="py-2 pr-3 font-normal">+Imp.</th>
                <th className="py-2 pr-3 font-normal">Propina</th>
                <th className="py-2 font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.participants.map((p) => (
                <tr key={p.participantId} className="border-b border-border/60 dark:border-slate-800/60">
                  <td className="py-2 pr-3 font-medium">
                    {p.name || 'Sin nombre'}
                    <span className="ml-1 text-xs text-muted">({p.tipPercentage}%)</span>
                  </td>
                  <td className="py-2 pr-3">{money(p.subtotal)}</td>
                  <td className="py-2 pr-3">{money(p.taxPortion)}</td>
                  <td className="py-2 pr-3">{money(p.discountPortion)}</td>
                  <td className="py-2 pr-3">{money(p.subtotalWithTax)}</td>
                  <td className="py-2 pr-3">{money(p.tip)}</td>
                  <td className="py-2 font-bold text-primary dark:text-primary-light">{money(p.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="pt-3 text-right text-muted">
                  Total general
                </td>
                <td className="pt-3 font-medium text-primary">
                  {money(summary.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
