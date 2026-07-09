import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { CollaborativeClosePanel } from '../components/CollaborativeClosePanel';
import { ErrorState } from '../components/ErrorState';
import { LiveConnectionBadge } from '../components/LiveConnectionBadge';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { ShareTicketPanel } from '../components/ShareTicketPanel';
import { avatarEmoji } from '../constants/avatars';
import { useTicket } from '../hooks/useTicket';
import { useTicketRealtime } from '../hooks/useTicketRealtime';
import { ticketsApi } from '../services/api';
import type { ShareInfo } from '../types/domain';

export function TicketControlPage() {
  const { id } = useParams<{ id: string }>();
  const { ticket, status, error, reload } = useTicket(id);
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRealtimeUpdate = useCallback(() => {
    void reload();
    setRefreshKey((k) => k + 1);
    if (id) {
      void ticketsApi.getShareInfo(id).then(setShare).catch(() => undefined);
    }
  }, [id, reload]);

  const { connected } = useTicketRealtime({
    shareCode: ticket?.shareCode,
    enabled: Boolean(ticket?.shareCode),
    onUpdate: handleRealtimeUpdate,
  });

  useEffect(() => {
    if (!id || !ticket?.shareCode) return;
    void ticketsApi.getShareInfo(id).then(setShare).catch(() => setShare(null));
  }, [id, ticket?.shareCode]);

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <BackButton to="/" className="-ml-2" />
        <LoadingState label="Cargando panel…" />
      </div>
    );
  }
  if (status === 'error' || !ticket) {
    return (
      <div className="space-y-4">
        <BackButton to="/" className="-ml-2" />
        <ErrorState message={error || 'Ticket no encontrado'} onRetry={() => void reload()} />
      </div>
    );
  }

  if (!ticket.shareCode) {
    return (
      <div className="space-y-4">
        <BackButton to={`/tickets/${id}/review`} className="-ml-2" />
        <ErrorState
          message="La división aún no ha iniciado"
          onRetry={() => window.location.assign(`/tickets/${id}/review`)}
        />
      </div>
    );
  }

  const participants = ticket.participants ?? [];
  const completed = participants.filter((p) => p.sessionStatus === 'COMPLETED').length;
  const paid = participants.filter((p) => p.paymentStatus === 'PAID').length;
  const isReviewing = ticket.sessionStatus === 'REVIEWING';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        subtitle={ticket.restaurantName || ticket.title}
        backTo="/"
        actions={
          <>
            <LiveConnectionBadge connected={connected} />
            {share ? (
              <Link to={`/tickets/${id}/share`} className="btn-secondary btn-sm">
                Compartir
              </Link>
            ) : null}
          </>
        }
      />

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground-muted dark:text-slate-400">Estado</p>
            <p className="font-semibold text-foreground dark:text-white">
              {ticket.sessionStatus?.replace(/_/g, ' ') ?? 'Activo'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground-muted dark:text-slate-400">
              {isReviewing ? 'Pagaron' : 'Respondieron'}
            </p>
            <p className="font-semibold">
              {isReviewing
                ? `${paid} de ${participants.length}`
                : `${completed} de ${ticket.expectedParticipantCount ?? (participants.length || '—')}`}
            </p>
          </div>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold text-foreground dark:text-white">Participantes</h2>
        {participants.length === 0 ? (
          <p className="text-sm text-foreground-muted">Nadie se ha unido todavía.</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((tp) => {
              const statusIcon =
                tp.sessionStatus === 'COMPLETED'
                  ? '🟢'
                  : tp.sessionStatus === 'SELECTING'
                    ? '🟡'
                    : tp.sessionStatus === 'ABANDONED'
                      ? '🔴'
                      : '⚪';
              return (
                <li
                  key={tp.id}
                  className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3 dark:bg-slate-800/50"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span>{avatarEmoji(tp.avatarId)}</span>
                    {tp.displayName ?? tp.participant.name ?? 'Participante'}
                    {tp.isAdmin && (
                      <span className="text-xs text-foreground-muted">(admin)</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    {tp.paymentStatus === 'PAID' && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Pagado
                      </span>
                    )}
                    <span title={tp.sessionStatus}>{statusIcon}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(isReviewing || (participants.length > 0 && completed >= participants.length)) && (
        <CollaborativeClosePanel
          ticketId={id!}
          sessionStatus={ticket.sessionStatus}
          refreshKey={refreshKey}
          onChanged={() => {
            void reload();
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {share && <ShareTicketPanel share={share} />}
    </div>
  );
}
