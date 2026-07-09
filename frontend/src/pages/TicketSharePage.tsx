import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { BackButton } from '../components/BackButton';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { ShareTicketPanel } from '../components/ShareTicketPanel';
import { useTicket } from '../hooks/useTicket';
import { ApiClientError, ticketsApi } from '../services/api';
import type { ShareInfo } from '../types/domain';

export function TicketSharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, status, error, reload } = useTicket(id);
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [shareStatus, setShareStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setShareStatus('loading');
      try {
        const data = await ticketsApi.getShareInfo(id);
        if (!cancelled) {
          setShare(data);
          setShareStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setShareStatus('error');
          setShareError(
            err instanceof ApiClientError ? err.message : 'No se pudo cargar el enlace.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === 'loading' || shareStatus === 'loading') {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate(-1)} className="-ml-2" />
        <LoadingState label="Preparando enlace…" />
      </div>
    );
  }

  if (status === 'error' || !ticket) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate(-1)} className="-ml-2" />
        <ErrorState message={error || 'Ticket no encontrado'} onRetry={() => void reload()} />
      </div>
    );
  }

  if (shareStatus === 'error' || !share) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate(-1)} className="-ml-2" />
        <ErrorState
          message={shareError || 'División no iniciada'}
          onRetry={() => navigate(`/tickets/${id}/review`)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compartir ticket"
        subtitle={ticket.restaurantName || ticket.title}
        onBack={() => navigate(-1)}
      />

      <Alert tone="info">
        Comparte este enlace con tu grupo. Cada persona elegirá lo que consumió.
      </Alert>

      <ShareTicketPanel share={share} />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => navigate(`/tickets/${id}/control`)}
        >
          Ir al panel de control
        </button>
        <Link to="/" className="btn-ghost w-full text-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
