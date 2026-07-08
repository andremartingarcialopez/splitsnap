import { Link } from 'react-router-dom';
import type { Ticket } from '../types/domain';

function money(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    COMPLETED: 'badge-success',
    FAILED: 'badge-error',
    PROCESSING: 'badge-info',
    PENDING: 'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

type TicketListProps = {
  tickets: Ticket[];
  onDelete: (ticket: Ticket) => void;
};

/** Listado responsive: tabla en md+, cards apiladas en móvil. */
export function TicketList({ tickets, onDelete }: TicketListProps) {
  return (
    <>
      <div className="card hidden overflow-hidden !p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted/80 text-foreground-muted dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Restaurante</th>
              <th className="px-5 py-3.5 font-semibold">Fecha</th>
              <th className="px-5 py-3.5 font-semibold">Estado</th>
              <th className="px-5 py-3.5 font-semibold">Total</th>
              <th className="px-5 py-3.5 font-semibold">Items</th>
              <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border transition hover:bg-surface-muted/50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/30"
              >
                <td className="px-5 py-4 font-semibold text-foreground dark:text-white">
                  {t.restaurantName || t.title}
                </td>
                <td className="px-5 py-4 text-foreground-muted dark:text-slate-400">
                  {new Date(t.createdAt).toLocaleString('es-MX')}
                </td>
                <td className="px-5 py-4">
                  <span className={statusBadge(t.processingStatus)}>{t.processingStatus}</span>
                </td>
                <td className="px-5 py-4 font-medium">{money(t.total)}</td>
                <td className="px-5 py-4 text-foreground-muted dark:text-slate-400">
                  {t.productCount ?? 0} · {t.participantCount ?? 0} pers.
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link to={`/tickets/${t.id}`} className="btn-secondary btn-sm touch-target">
                      Ver
                    </Link>
                    <button
                      type="button"
                      className="btn-danger btn-sm touch-target"
                      onClick={() => onDelete(t)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {tickets.map((t) => (
          <article key={t.id} className="card space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground dark:text-white">
                  {t.restaurantName || t.title}
                </h2>
                <p className="text-xs text-foreground-muted dark:text-slate-400">
                  {new Date(t.createdAt).toLocaleString('es-MX')}
                </p>
              </div>
              <span className={statusBadge(t.processingStatus)}>{t.processingStatus}</span>
            </div>
            <p className="text-sm">
              Total{' '}
              <span className="text-lg font-bold text-primary dark:text-primary-light">
                {money(t.total)}
              </span>
            </p>
            <div className="flex gap-2">
              <Link
                to={`/tickets/${t.id}`}
                className="btn-secondary btn-sm touch-target flex-1 text-center"
              >
                Ver
              </Link>
              <button
                type="button"
                className="btn-danger btn-sm touch-target flex-1"
                onClick={() => onDelete(t)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
