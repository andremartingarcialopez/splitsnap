import { Link, useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTicket';
import { formatMoney } from '../utils/money';

const ACTIVE_STATUSES = new Set([
  'WAITING_FOR_PARTICIPANTS',
  'IN_PROGRESS',
  'REVIEWING',
  'REOPENED',
]);

export function HomePage() {
  const navigate = useNavigate();
  const { tickets, status } = useTickets();

  const activeTickets =
    status === 'ready'
      ? tickets.filter(
          (t) => t.shareCode && ACTIVE_STATUSES.has(t.sessionStatus ?? '') && !t.finalizedAt,
        )
      : [];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">SplitSnap</h1>
        <p className="text-foreground-muted dark:text-slate-400">
          Escanea, revisa y comparte la cuenta con tu grupo.
        </p>
      </div>

      <button type="button" className="btn-primary w-full max-w-sm py-4 text-base" onClick={() => navigate('/scan')}>
        Escanear ticket
      </button>

      <Link to="/history" className="text-sm font-semibold text-primary hover:underline dark:text-primary-light">
        Ver historial
      </Link>

      {activeTickets.length > 0 && (
        <section className="w-full max-w-sm space-y-3 text-left">
          <h2 className="text-sm font-semibold text-foreground-muted dark:text-slate-400">
            Sesiones activas
          </h2>
          <ul className="space-y-2">
            {activeTickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  className="card w-full p-4 text-left transition hover:border-primary/40"
                  onClick={() => navigate(`/tickets/${ticket.id}/control`)}
                >
                  <p className="font-semibold text-foreground dark:text-white">
                    {ticket.restaurantName || ticket.title}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
                    {ticket.shareCode} · {formatMoney(ticket.total)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
