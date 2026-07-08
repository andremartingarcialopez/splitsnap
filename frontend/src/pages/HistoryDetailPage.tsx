import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { ApiClientError, historyApi } from '../services/api';
import type { HistoryDetail, Product, TicketParticipantLink } from '../types/domain';
import { resolveMediaUrl } from '../utils/mediaUrl';

function money(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);
}

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setStatus('loading');
    setError(null);
    try {
      const data = await historyApi.get(id);
      setDetail(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el detalle.');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') return <Spinner label="Cargando detalle histórico…" />;

  if (status === 'error' || !detail) {
    return (
      <Alert tone="error">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error || 'Ticket no encontrado en historial'}</span>
          <Link to="/history" className="btn-secondary text-center">
            Volver al historial
          </Link>
        </div>
      </Alert>
    );
  }

  const { ticket, summary } = detail;
  const products = ticket.products ?? [];
  const participants = ticket.participants ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Histórico · solo lectura</p>
          <h1 className="text-[22px] font-light tracking-tight">
            {ticket.restaurantName || ticket.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Finalizado{' '}
            {ticket.finalizedAt
              ? new Date(ticket.finalizedAt).toLocaleString('es-MX')
              : '—'}{' '}
            · propina {ticket.tipMode}
          </p>
        </div>
        <Link to="/history" className="btn-secondary text-center">
          Historial
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="card overflow-hidden p-0">
          {ticket.ticketImageUrl.startsWith('/uploads') ? (
            <img
              src={resolveMediaUrl(ticket.ticketImageUrl)}
              alt="Ticket"
              className="h-full max-h-72 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-40 items-center justify-center bg-neutral text-sm text-muted">
              Sin imagen
            </div>
          )}
        </div>

        <div className="card grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted">Subtotal</p>
            <p className="text-base font-medium">{money(ticket.subtotal)}</p>
          </div>
          <div>
            <p className="text-muted">IVA</p>
            <p className="text-base font-medium">{money(ticket.tax)}</p>
          </div>
          <div>
            <p className="text-muted">Descuento</p>
            <p className="text-base font-medium">{money(ticket.discount)}</p>
          </div>
          <div>
            <p className="text-muted">Total impreso</p>
            <p className="text-base font-medium text-primary">{money(ticket.total)}</p>
          </div>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="text-base font-medium">Participantes</h2>
        {participants.length === 0 ? (
          <p className="text-sm text-muted">Sin participantes.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {participants.map((tp: TicketParticipantLink) => (
              <li key={tp.id} className="py-2">
                {tp.participant.name || <span className="italic text-muted">Sin nombre</span>}
                {ticket.tipMode === 'INDIVIDUAL' && tp.individualTipPercentage != null && (
                  <span className="ml-2 text-muted">· {tp.individualTipPercentage}% propina</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-base font-medium">Productos y asignaciones</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted">Sin productos.</p>
        ) : (
          <ul className="space-y-4">
            {products.map((p: Product) => (
              <li key={p.id} className="rounded-md border border-border p-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span>{money(p.unitPrice)}</span>
                </div>
                {(p.assignments ?? []).length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {(p.assignments ?? []).map((a) => (
                      <li key={a.id}>
                        {a.participant?.name || 'Participante'} · ratio {a.shareRatio}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted">Sin asignaciones</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="text-base font-medium">Resumen de división</h2>
        {summary.varianceWarning && summary.varianceAmount != null && (
          <Alert tone="warning">
            Diferencia vs total impreso: {money(summary.varianceAmount)}
          </Alert>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
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
                <tr key={p.participantId} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">
                    {p.name || 'Sin nombre'}
                    <span className="ml-1 text-xs text-muted">({p.tipPercentage}%)</span>
                  </td>
                  <td className="py-2 pr-3">{money(p.subtotal)}</td>
                  <td className="py-2 pr-3">{money(p.taxPortion)}</td>
                  <td className="py-2 pr-3">{money(p.discountPortion)}</td>
                  <td className="py-2 pr-3">{money(p.subtotalWithTax)}</td>
                  <td className="py-2 pr-3">{money(p.tip)}</td>
                  <td className="py-2 font-medium text-primary">{money(p.total)}</td>
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
      </section>
    </div>
  );
}
