import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { BackButton } from '../components/BackButton';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { ShareTicketPanel } from '../components/ShareTicketPanel';
import { avatarEmoji } from '../constants/avatars';
import { useTicket } from '../hooks/useTicket';
import { ticketsApi } from '../services/api';
import type { ShareInfo } from '../types/domain';

export function TicketControlPage() {
  const { id } = useParams<{ id: string }>();
  const { ticket, status, error, reload } = useTicket(id);
  const [share, setShare] = useState<ShareInfo | null>(null);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        subtitle={ticket.restaurantName || ticket.title}
        backTo="/"
        actions={
          share ? (
            <Link to={`/tickets/${id}/share`} className="btn-secondary btn-sm">
              Compartir
            </Link>
          ) : undefined
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
            <p className="text-sm text-foreground-muted dark:text-slate-400">Respondieron</p>
            <p className="font-semibold">
              {completed} de {ticket.expectedParticipantCount ?? (participants.length || '—')}
            </p>
          </div>
        </div>

        <Alert tone="info">
          Tiempo real llegará en la Fase 4. Por ahora puedes volver a compartir el enlace y revisar
          quién se ha unido.
        </Alert>
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
                  <span title={tp.sessionStatus}>{statusIcon}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {share && <ShareTicketPanel share={share} />}
    </div>
  );
}
