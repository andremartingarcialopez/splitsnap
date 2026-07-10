import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { CollaborativeClosePanel } from '../components/CollaborativeClosePanel';
import { ErrorState } from '../components/ErrorState';
import { LiveConnectionBadge } from '../components/LiveConnectionBadge';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { ParticipantSessionBadge } from '../components/ParticipantSessionBadge';
import { ShareTicketPanel } from '../components/ShareTicketPanel';
import { avatarEmoji } from '../constants/avatars';
import { useConfirm } from '../context/ConfirmContext';
import { useTicket } from '../hooks/useTicket';
import { useTicketRealtime } from '../hooks/useTicketRealtime';
import { ApiClientError, ticketsApi } from '../services/api';
import type { ShareInfo } from '../types/domain';
import { showSuccessToast } from '../utils/toast';
import { formatTicketSessionStatus } from '../utils/statusLabels';

export function TicketControlPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { ticket, status, error, reload } = useTicket(id);
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRealtimeUpdate = useCallback(() => {
    void reload({ silent: true });
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

  async function handleDeleteSession() {
    if (!ticket) return;
    const label = ticket.restaurantName || ticket.title;
    const ok = await confirm({
      title: 'Eliminar sesión',
      message: `¿Eliminar «${label}»? Se borrarán productos, participantes y asignaciones.`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ticketsApi.remove(ticket.id);
      showSuccessToast('Sesión eliminada.');
      navigate('/');
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la sesión.');
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <LoadingState label="Cargando panel…" />
      </div>
    );
  }
  if (status === 'error' || !ticket) {
    return (
      <div className="space-y-4">
        <ErrorState message={error || 'Ticket no encontrado'} onRetry={() => void reload()} />
      </div>
    );
  }

  if (!ticket.shareCode) {
    return (
      <div className="space-y-4">
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
        actions={
          <>
            <LiveConnectionBadge connected={connected} />
            <button
              type="button"
              className="btn-danger btn-sm"
              onClick={() => void handleDeleteSession()}
            >
              Eliminar sesión
            </button>
          </>
        }
      />

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <div className="card space-y-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground-muted dark:text-slate-400">Estado</p>
            <p className="font-semibold text-foreground dark:text-white">
              {formatTicketSessionStatus(ticket.sessionStatus)}
            </p>
          </div>
          <div className="shrink-0 text-right">
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
            {participants.map((tp) => (
              <li
                key={tp.id}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 dark:bg-slate-800/50"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 font-medium">
                  <span className="shrink-0" aria-hidden>
                    {avatarEmoji(tp.avatarId)}
                  </span>
                  <span className="min-w-0 truncate">
                    {tp.displayName ?? tp.participant.name ?? 'Participante'}
                    {tp.isAdmin && (
                      <span className="ml-1 text-xs font-normal text-foreground-muted">
                        (administrador)
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {tp.paymentStatus === 'PAID' && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Pagado
                    </span>
                  )}
                  <ParticipantSessionBadge sessionStatus={tp.sessionStatus} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(isReviewing || (participants.length > 0 && completed >= participants.length)) && (
        <CollaborativeClosePanel
          ticketId={id!}
          sessionStatus={ticket.sessionStatus}
          refreshKey={refreshKey}
          products={ticket.products ?? []}
          ticketParticipants={ticket.participants}
          onChanged={() => {
            // Solo actualiza badges del panel; el resumen ya se recargó en silencio
            void reload({ silent: true });
          }}
        />
      )}

      {share && <ShareTicketPanel share={share} />}
    </div>
  );
}
