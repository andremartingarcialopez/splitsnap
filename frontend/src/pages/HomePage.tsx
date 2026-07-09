import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { AppIcon } from '../components/AppIcon';
import { Modal } from '../components/Modal';
import { ScanProcessingOverlay } from '../components/ScanProcessingOverlay';
import { SwipeToDeleteRow } from '../components/SwipeToDeleteRow';
import { TicketImageSourcePicker } from '../components/TicketImageSourcePicker';
import { useConfirm } from '../context/ConfirmContext';
import { useTicketScanFlow } from '../hooks/useTicketScanFlow';
import { useTickets } from '../hooks/useTicket';
import { ApiClientError, ticketsApi } from '../services/api';
import type { Ticket } from '../types/domain';
import { formatMoney } from '../utils/money';
import { showSuccessToast } from '../utils/toast';
import { faUtensils } from '../icons';

const ACTIVE_STATUSES = new Set([
  'WAITING_FOR_PARTICIPANTS',
  'IN_PROGRESS',
  'REVIEWING',
  'REOPENED',
]);

export function HomePage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { tickets, status, reload } = useTickets();
  const [actionError, setActionError] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const { processing, error, scanFile, clearScanError } = useTicketScanFlow();

  const activeTickets =
    status === 'ready'
      ? tickets.filter(
          (t) => t.shareCode && ACTIVE_STATUSES.has(t.sessionStatus ?? '') && !t.finalizedAt,
        )
      : [];

  function openScanModal() {
    clearScanError();
    setScanModalOpen(true);
  }

  function closeScanModal() {
    setScanModalOpen(false);
    clearScanError();
  }

  async function handleScanFile(file: File) {
    await scanFile(file, { showPreview: false });
  }

  async function handleDeleteSession(ticket: Ticket) {
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
      setActionError(null);
      await reload({ silent: true });
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la sesión.');
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center space-y-8 text-center">
      <Modal
        open={scanModalOpen && !processing}
        title="Escanear ticket"
        onClose={closeScanModal}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-muted dark:text-slate-400">
            Elige cómo capturar el ticket. El procesamiento comienza al seleccionar la imagen.
          </p>
          <TicketImageSourcePicker
            idPrefix="home-ticket"
            onFileSelected={(file) => void handleScanFile(file)}
            disabled={processing}
          />
          {error && (
            <Alert tone="error">
              <div className="space-y-2 text-left">
                <p>{error}</p>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    setScanModalOpen(false);
                    navigate('/scan');
                  }}
                >
                  Ir a ingreso manual
                </button>
              </div>
            </Alert>
          )}
        </div>
      </Modal>

      <ScanProcessingOverlay active={processing} />

      <div className="space-y-3">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-glow">
          <AppIcon icon={faUtensils} size="2xl" className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">SplitSnap</h1>
        <p className="text-foreground-muted dark:text-slate-400">
          Escanea, revisa y comparte la cuenta con tu grupo.
        </p>
      </div>

      <button type="button" className="btn-primary w-full max-w-sm py-4 text-base" onClick={openScanModal}>
        Escanear ticket
      </button>

      {actionError && (
        <div className="w-full max-w-sm text-left">
          <Alert tone="error">{actionError}</Alert>
        </div>
      )}

      {activeTickets.length > 0 && (
        <section className="w-full max-w-sm space-y-3 text-left">
          <h2 className="text-sm font-semibold text-foreground-muted dark:text-slate-400">
            Sesiones activas
          </h2>
          <ul className="space-y-2">
            {activeTickets.map((ticket) => (
              <li key={ticket.id}>
                <SwipeToDeleteRow
                  onDelete={() => void handleDeleteSession(ticket)}
                  desktopDelete={
                    <button
                      type="button"
                      className="btn-danger btn-sm shrink-0 self-center mr-3 touch-target"
                      aria-label={`Eliminar sesión ${ticket.restaurantName || ticket.title}`}
                      onClick={() => void handleDeleteSession(ticket)}
                    >
                      Eliminar
                    </button>
                  }
                >
                  <button
                    type="button"
                    className="w-full p-4 text-left transition hover:bg-surface-muted/50 dark:hover:bg-slate-800/30"
                    onClick={() => navigate(`/tickets/${ticket.id}/control`)}
                  >
                    <p className="font-semibold text-foreground dark:text-white">
                      {ticket.restaurantName || ticket.title}
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
                      {ticket.shareCode} · {formatMoney(ticket.total)}
                    </p>
                  </button>
                </SwipeToDeleteRow>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
