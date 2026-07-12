import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { AvatarPicker } from '../components/AvatarPicker';
import { ErrorState } from '../components/ErrorState';
import { LiveConnectionBadge } from '../components/LiveConnectionBadge';
import { PublicTicketPageSkeleton } from '../components/Skeleton';
import { SelectionFloatingBar } from '../components/SelectionFloatingBar';
import {
  ParticipantAvatarBadge,
  ParticipantMiniSummary,
  ParticipantProductCard,
} from '../components/ParticipantProductCard';
import {
  ProductScrollAnchor,
  ProductScrollIndex,
} from '../components/ProductScrollIndex';
import { PublicTicketLayout } from '../components/PublicTicketLayout';
import { TicketImagePreview } from '../components/TicketImagePreview';
import { AVATAR_GALLERY } from '../constants/avatars';
import { useTicketRealtime } from '../hooks/useTicketRealtime';
import { ApiClientError, publicApi } from '../services/publicApi';
import type { ParticipantSession, PublicTicket, TicketUpdatedPayload } from '../types/domain';
import { formatMoney } from '../utils/money';
import { sortProductsByName } from '../utils/sortProductsByName';
import {
  clearParticipantSession,
  loadParticipantSession,
  saveParticipantSession,
} from '../utils/participantSession';
import { showInfoToast } from '../utils/toast';

type Step = 'welcome' | 'register' | 'select' | 'waiting';

function participantSummary(session: ParticipantSession) {
  return (
    <ParticipantMiniSummary
      productCount={session.selectedProducts.length}
      subtotal={session.subtotal}
      taxPortion={session.taxPortion}
      discountPortion={session.discountPortion}
      tipPercentage={session.tipPercentage}
      tip={session.tip}
      total={session.total}
    />
  );
}

export function PublicTicketPage() {
  const { shareCode = '' } = useParams<{ shareCode: string }>();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATAR_GALLERY[0]?.id ?? 'bear');

  const code = shareCode.toUpperCase();

  const resolveStep = useCallback((sess: ParticipantSession | null) => {
    if (!sess) return 'welcome' as Step;
    if (sess.sessionStatus === 'COMPLETED' && !sess.canEdit) return 'waiting' as Step;
    if (sess.sessionStatus === 'COMPLETED' && sess.canEdit) return 'select' as Step;
    return 'select' as Step;
  }, []);

  const bootstrap = useCallback(async () => {
    if (!code) {
      setError('Código de ticket inválido');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const publicTicket = await publicApi.getTicket(code);
      setTicket(publicTicket);

      const storedId = loadParticipantSession(code);
      if (storedId) {
        const restored = await publicApi.getSession(code, storedId);
        setTicket(restored.ticket);
        setSession(restored.session);
        setStep(resolveStep(restored.session));
      } else {
        setStep('welcome');
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el ticket.');
    } finally {
      setLoading(false);
    }
  }, [code, resolveStep]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleRealtimeUpdate = useCallback(
    (payload: TicketUpdatedPayload) => {
      if (payload.event === 'ticket_finalized') {
        showInfoToast('El administrador cerró el ticket.');
      }
      setTicket(payload.ticket);
      const participantId = session?.ticketParticipantId;
      if (!participantId) return;
      void publicApi
        .getSession(code, participantId)
        .then((data) => {
          setTicket(data.ticket);
          setSession(data.session);
        })
        .catch(() => undefined);
    },
    [code, session?.ticketParticipantId],
  );

  const { connected } = useTicketRealtime({
    shareCode: code,
    enabled: Boolean(code) && !loading && Boolean(ticket),
    onUpdate: handleRealtimeUpdate,
  });

  const selectedSet = useMemo(
    () => new Set(session?.selectedProductIds ?? []),
    [session?.selectedProductIds],
  );

  const productsSortedByName = useMemo(
    () => sortProductsByName(ticket?.products ?? []),
    [ticket?.products],
  );

  const productScrollItems = useMemo(
    () => productsSortedByName.map((p) => ({ id: p.id, label: p.name })),
    [productsSortedByName],
  );

  async function handleJoin(existingId?: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await publicApi.join(code, {
        ticketParticipantId: existingId,
        displayName: displayName.trim() || undefined,
        avatarId,
      });
      saveParticipantSession(code, result.session.ticketParticipantId);
      setTicket(result.ticket);
      setSession(result.session);
      setStep(resolveStep(result.session));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo unir al ticket.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(productId: string) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const result = await publicApi.toggleProduct(code, session.ticketParticipantId, productId);
      setTicket(result.ticket);
      setSession(result.session);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const result = await publicApi.submitSelection(code, session.ticketParticipantId);
      setTicket(result.ticket);
      setSession(result.session);
      setShowConfirm(false);
      setStep('waiting');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo enviar.');
    } finally {
      setBusy(false);
    }
  }

  function handleStartOver() {
    clearParticipantSession(code);
    setSession(null);
    setStep('register');
  }

  if (loading) {
    return (
      <PublicTicketLayout>
        <PublicTicketPageSkeleton />
      </PublicTicketLayout>
    );
  }

  if (error && !ticket) {
    return (
      <PublicTicketLayout>
        <ErrorState message={error} onRetry={() => void bootstrap()} />
      </PublicTicketLayout>
    );
  }

  if (!ticket) {
    return (
      <PublicTicketLayout>
        <ErrorState message="Ticket no encontrado" onRetry={() => void bootstrap()} />
      </PublicTicketLayout>
    );
  }

  const expected = ticket.expectedParticipantCount ?? ticket.participantCount;
  const progressPct =
    expected > 0 ? Math.min(100, (ticket.completedParticipantCount / expected) * 100) : 0;

  return (
    <PublicTicketLayout>
      <div className="space-y-5">
        {(step === 'select' || step === 'waiting') && (
          <div className="flex justify-end">
            <LiveConnectionBadge connected={connected} />
          </div>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {step === 'welcome' && (
          <>
            <div className="card space-y-4 text-center">
              <p className="text-sm text-foreground-muted dark:text-slate-400">
                {ticket.invitedBy} te invitó a dividir este ticket
              </p>
              <h1 className="text-2xl font-bold text-foreground dark:text-white">
                {ticket.restaurantName || ticket.title}
              </h1>
              <div className="grid grid-cols-2 gap-3 text-left text-sm">
                <div className="rounded-2xl bg-surface-muted p-3 dark:bg-slate-800/50">
                  <p className="text-foreground-muted">Productos</p>
                  <p className="text-lg font-bold">{ticket.productCount}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted p-3 dark:bg-slate-800/50">
                  <p className="text-foreground-muted">Participantes</p>
                  <p className="text-lg font-bold">{expected || ticket.participantCount}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-surface-muted p-3 dark:bg-slate-800/50">
                  <p className="text-foreground-muted">Total del ticket</p>
                  <p className="text-lg font-bold text-primary dark:text-primary-light">
                    {formatMoney(ticket.total ?? ticket.subtotal)}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary w-full py-4"
              onClick={() => setStep('register')}
            >
              Comenzar
            </button>
          </>
        )}

        {step === 'register' && (
          <>
            <div className="card space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground dark:text-white">
                  ¿Cómo te llamamos?
                </h2>
                <p className="text-sm text-foreground-muted dark:text-slate-400">
                  El nombre es opcional. Si lo dejas vacío te asignamos uno automáticamente.
                </p>
              </div>
              <input
                className="input"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <AvatarPicker value={avatarId} onChange={setAvatarId} />
            </div>
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => void handleJoin()}
            >
              {busy ? 'Uniéndote…' : 'Entrar al ticket'}
            </button>
          </>
        )}

        {step === 'select' && session && (
          <>
            <div className="flex items-center gap-3">
              <ParticipantAvatarBadge avatarId={session.avatarId} />
              <div>
                <p className="font-semibold text-foreground dark:text-white">
                  {session.displayName}
                </p>
                <p className="text-sm text-foreground-muted">
                  Marca solo lo que consumiste
                </p>
              </div>
            </div>

            {ticket.sessionStatus === 'REOPENED' && (
              <Alert tone="warning">
                El administrador reabrió el ticket. Puedes modificar tu selección.
              </Alert>
            )}

            <TicketImagePreview imageUrl={ticket.ticketImageUrl} />

            <ProductScrollIndex items={productScrollItems} bottomInset={96} />

            <div className="space-y-2 pb-4">
              {productsSortedByName.map((product) => (
                <ProductScrollAnchor key={product.id} productId={product.id}>
                  <ParticipantProductCard
                    product={product}
                    selected={selectedSet.has(product.id)}
                    disabled={busy}
                    onToggle={() => void handleToggle(product.id)}
                  />
                </ProductScrollAnchor>
              ))}
            </div>

            <SelectionFloatingBar
              productCount={session.selectedProducts.length}
              subtotal={session.subtotal}
              total={session.total}
              disabled={busy}
              busy={busy}
              onContinue={() => setShowConfirm(true)}
            />
          </>
        )}

        {step === 'waiting' && session && (
          <>
            {ticket.isFinalized || ticket.sessionStatus === 'FINISHED' ? (
              <div className="card space-y-4 text-center">
                <p className="text-4xl">🏁</p>
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  Ticket finalizado
                </h2>
                <p className="text-sm text-foreground-muted dark:text-slate-400">
                  El administrador cerró este ticket. Gracias por usar SplitSnap.
                </p>
                {participantSummary(session)}
              </div>
            ) : ticket.sessionStatus === 'REVIEWING' ? (
              <div className="card space-y-4 text-center">
                <p className="text-4xl">💰</p>
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  Tu total a pagar
                </h2>
                <p className="text-sm text-foreground-muted dark:text-slate-400">
                  Tu consumo ya fue enviado al administrador.
                </p>
                {participantSummary(session)}
              </div>
            ) : (
              <div className="card space-y-4 text-center">
                <p className="text-4xl">✅</p>
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  Tu consumo fue enviado
                </h2>
                <p className="text-sm text-foreground-muted dark:text-slate-400">
                  Esperando a los demás participantes
                </p>
                <p className="font-semibold">
                  {ticket.completedParticipantCount} de {expected || ticket.participantCount}{' '}
                  personas han terminado
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-border dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {participantSummary(session)}
              </div>
            )}

            {session.canEdit && ticket.sessionStatus !== 'FINISHED' && !ticket.isFinalized ? (
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => setStep('select')}
              >
                Modificar selección
              </button>
            ) : (
              !ticket.isFinalized &&
              ticket.sessionStatus !== 'FINISHED' &&
              ticket.sessionStatus !== 'REVIEWING' && (
                <Alert tone="info">
                  Tu selección fue enviada. Si necesitas cambiarla, pide al administrador que
                  reabra el ticket.
                </Alert>
              )
            )}

            {ticket.sessionStatus === 'REVIEWING' && !ticket.isFinalized && (
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={handleStartOver}
              >
                Entrar como otra persona en este dispositivo
              </button>
            )}
          </>
        )}

        {showConfirm && session && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-bold text-foreground dark:text-white">
                ¿Todo correcto?
              </h3>
              <ul className="space-y-2 text-sm">
                {session.selectedProducts.length === 0 ? (
                  <li className="text-foreground-muted">No seleccionaste productos.</li>
                ) : (
                  session.selectedProducts.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span>
                        {p.emoji ? `${p.emoji} ` : ''}
                        {p.name}
                      </span>
                      <span className="font-medium">{formatMoney(p.unitPrice)}</span>
                    </li>
                  ))
                )}
              </ul>
              {participantSummary(session)}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  disabled={busy}
                  onClick={() => setShowConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  disabled={busy}
                  onClick={() => void handleSubmit()}
                >
                  {busy ? 'Enviando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PublicTicketLayout>
  );
}
