import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { TicketList } from '../components/TicketList';
import { ApiClientError, ticketsApi } from '../services/api';
import { useTickets } from '../hooks/useTicket';
import type { Ticket } from '../types/domain';
import { useConfirm } from '../context/ConfirmContext';
import { showSuccessToast } from '../utils/toast';

export function TicketsPage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { tickets, status, error, reload } = useTickets();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(ticket: Ticket) {
    const label = ticket.restaurantName || ticket.title;
    const ok = await confirm({
      title: 'Eliminar ticket',
      message: `¿Eliminar «${label}»? Se borrarán productos, participantes del ticket y asignaciones.`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ticketsApi.remove(ticket.id);
      showSuccessToast('Ticket eliminado.');
      setActionError(null);
      await reload({ silent: true });
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        subtitle="Historial y gestión de cuentas digitalizadas."
        actions={
          <Link to="/scan" className="btn-primary w-full text-center sm:w-auto">
            Escanear ticket
          </Link>
        }
      />

      {actionError && <Alert tone="error">{actionError}</Alert>}

      {status === 'loading' && <LoadingState label="Cargando tickets…" />}

      {status === 'error' && (
        <ErrorState message={error || 'Error desconocido'} onRetry={() => void reload()} />
      )}

      {status === 'ready' && tickets.length === 0 && (
        <EmptyState
          title="Aún no hay tickets"
          description="Digitaliza una foto o crea un ticket manual para empezar a dividir."
          actionLabel="Nuevo ticket"
          onAction={() => navigate('/scan')}
        />
      )}

      {status === 'ready' && tickets.length > 0 && (
        <TicketList tickets={tickets} onDelete={(t) => void handleDelete(t)} />
      )}
    </div>
  );
}
