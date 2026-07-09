import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminProductSelectCard } from '../components/AdminProductSelectCard';
import { Alert } from '../components/Alert';
import { AvatarPicker } from '../components/AvatarPicker';
import { BackButton } from '../components/BackButton';
import { ErrorState } from '../components/ErrorState';
import { GlobalTipSelector } from '../components/GlobalTipSelector';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { ProductReviewCard } from '../components/ProductReviewCard';
import { AVATAR_GALLERY } from '../constants/avatars';
import { useTicket } from '../hooks/useTicket';
import { ApiClientError, assignmentsApi, ticketsApi } from '../services/api';
import { formatMoney } from '../utils/money';
import { showSuccessToast } from '../utils/toast';

type WizardStep = 'products' | 'settings' | 'selection';

const POST_DIVISION = new Set([
  'WAITING_FOR_PARTICIPANTS',
  'IN_PROGRESS',
  'REVIEWING',
  'FINISHED',
]);

export function TicketReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, status, error, reload } = useTicket(id);
  const [step, setStep] = useState<WizardStep>('products');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [globalTip, setGlobalTip] = useState(10);
  const [expectedCount, setExpectedCount] = useState('');
  const [adminName, setAdminName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATAR_GALLERY[0]?.id ?? 'bear');

  useEffect(() => {
    if (!ticket) return;
    if (ticket.shareCode && POST_DIVISION.has(ticket.sessionStatus ?? '')) {
      navigate(`/tickets/${ticket.id}/share`, { replace: true });
      return;
    }
    setGlobalTip(ticket.globalTipPercentage ?? 10);
    setExpectedCount(
      ticket.expectedParticipantCount != null ? String(ticket.expectedParticipantCount) : '',
    );
    const admin = ticket.participants?.find((p) => p.isAdmin);
    if (admin) {
      setAdminName(admin.displayName ?? admin.participant.name ?? '');
      if (admin.avatarId) setAvatarId(admin.avatarId);
    }
  }, [ticket, navigate]);

  const adminParticipant = useMemo(
    () => ticket?.participants?.find((p) => p.isAdmin),
    [ticket?.participants],
  );

  const adminSelectedIds = useMemo(() => {
    if (!adminParticipant || !ticket?.products) return new Set<string>();
    return new Set(
      ticket.products
        .filter((p) =>
          (p.assignments ?? []).some((a) => a.participantId === adminParticipant.participantId),
        )
        .map((p) => p.id),
    );
  }, [adminParticipant, ticket?.products]);

  const productsSubtotal = useMemo(
    () => (ticket?.products ?? []).reduce((sum, p) => sum + p.unitPrice, 0),
    [ticket?.products],
  );

  const taxRatePercent = useMemo(() => {
    if (ticket?.scanTaxRate != null && ticket.scanTaxRate > 0) {
      return Math.round(ticket.scanTaxRate * 1000) / 10;
    }
    if (ticket?.subtotal && ticket?.tax && ticket.subtotal > 0) {
      return Math.round((ticket.tax / ticket.subtotal) * 1000) / 10;
    }
    return null;
  }, [ticket?.scanTaxRate, ticket?.subtotal, ticket?.tax]);

  const printedTotalDiff = useMemo(() => {
    if (ticket?.printedTotal == null || ticket.total == null) return null;
    return Math.abs(ticket.total - ticket.printedTotal);
  }, [ticket?.printedTotal, ticket?.total]);

  const hasPrintedVariance =
    printedTotalDiff != null && printedTotalDiff > 0.01;

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    const unitPrice = Number(newPrice);
    if (!newName.trim() || Number.isNaN(unitPrice) || unitPrice <= 0) {
      setActionError('Nombre y precio válidos son obligatorios.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await ticketsApi.addProduct(id, { name: newName.trim(), unitPrice });
      setNewName('');
      setNewPrice('');
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se pudo agregar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartDivision() {
    if (!id) return;
    setSaving(true);
    setActionError(null);
    try {
      await ticketsApi.startDivision(id, {
        globalTipPercentage: globalTip,
        expectedParticipantCount: expectedCount ? Number(expectedCount) : undefined,
      });
      showSuccessToast('División iniciada');
      navigate(`/tickets/${id}/share`);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se pudo iniciar.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSettingsAndContinue() {
    if (!id) return;
    const name = adminName.trim() || 'Administrador';
    setSaving(true);
    setActionError(null);
    try {
      await ticketsApi.setupAdmin(id, { displayName: name, avatarId });
      await ticketsApi.updateCollaborationSettings(id, {
        globalTipPercentage: globalTip,
        expectedParticipantCount: expectedCount ? Number(expectedCount) : null,
      });
      await reload();
      setStep('selection');
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se guardó la configuración.');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (step === 'settings') {
      setStep('products');
      return;
    }
    if (step === 'selection') {
      setStep('settings');
      return;
    }
    navigate('/scan');
  }

  async function toggleAdminProduct(productId: string) {
    if (!adminParticipant) return;
    const product = ticket?.products?.find((p) => p.id === productId);
    if (!product) return;

    setSaving(true);
    setActionError(null);
    try {
      const mine = (product.assignments ?? []).find(
        (a) => a.participantId === adminParticipant.participantId,
      );
      if (mine) {
        await assignmentsApi.remove(mine.id);
      } else {
        await assignmentsApi.assignOne({
          productId,
          participantId: adminParticipant.participantId,
        });
      }
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar.');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate('/scan')} className="-ml-2" />
        <LoadingState label="Cargando ticket…" />
      </div>
    );
  }
  if (status === 'error' || !ticket) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate('/scan')} className="-ml-2" />
        <ErrorState message={error || 'Ticket no encontrado'} onRetry={() => void reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisar ticket"
        subtitle={
          ticket.restaurantName ||
          ticket.title ||
          new Date(ticket.createdAt).toLocaleDateString('es-MX')
        }
        onBack={handleBack}
      />

      <div className="flex gap-2">
        {(['products', 'settings', 'selection'] as WizardStep[]).map((s, idx) => (
          <div
            key={s}
            className={[
              'h-1.5 flex-1 rounded-full',
              step === s || idx < ['products', 'settings', 'selection'].indexOf(step)
                ? 'bg-primary'
                : 'bg-border dark:bg-slate-800',
            ].join(' ')}
          />
        ))}
      </div>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      {step === 'products' && (
        <>
          <div className="card space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-foreground-muted">
                {ticket.products?.length ?? 0} productos
              </span>
            </div>

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Suma productos</dt>
                <dd className="font-medium">{formatMoney(productsSubtotal)}</dd>
              </div>
              {(ticket.tax ?? 0) > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground-muted">
                    Impuesto
                    {taxRatePercent != null ? ` (≈${taxRatePercent}%)` : ''}
                  </dt>
                  <dd className="font-medium">{formatMoney(ticket.tax ?? 0)}</dd>
                </div>
              )}
              {(ticket.discount ?? 0) > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground-muted">Descuento</dt>
                  <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                    −{formatMoney(ticket.discount ?? 0)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-2 dark:border-slate-800">
                <dt className="font-semibold text-foreground dark:text-white">
                  Total calculado
                </dt>
                <dd className="text-lg font-bold text-primary dark:text-primary-light">
                  {formatMoney(ticket.total ?? productsSubtotal)}
                </dd>
              </div>
              {ticket.printedTotal != null && (
                <div className="flex justify-between gap-4 text-xs">
                  <dt className="text-foreground-muted">Total impreso (referencia)</dt>
                  <dd className="text-foreground-muted">{formatMoney(ticket.printedTotal)}</dd>
                </div>
              )}
            </dl>

            {hasPrintedVariance && (
              <Alert tone="warning">
                Los productos ya no coinciden con el ticket escaneado (
                {formatMoney(printedTotalDiff!)} de diferencia vs. el total impreso). El total
                calculado se actualiza automáticamente al editar productos.
              </Alert>
            )}
          </div>

          <div className="space-y-3">
            {(ticket.products ?? []).map((product) => (
              <ProductReviewCard
                key={product.id}
                product={product}
                saving={saving}
                onSave={async (input) => {
                  if (!id) return;
                  await ticketsApi.updateProduct(id, product.id, input);
                  await reload();
                }}
                onDelete={async () => {
                  if (!id) return;
                  await ticketsApi.deleteProduct(id, product.id);
                  await reload();
                }}
                onDuplicate={async () => {
                  if (!id) return;
                  await ticketsApi.addProduct(id, {
                    name: product.name,
                    unitPrice: product.unitPrice,
                  });
                  await reload();
                }}
              />
            ))}
          </div>

          <form className="card space-y-3" onSubmit={handleAddProduct}>
            <h3 className="font-semibold text-foreground dark:text-white">Agregar producto</h3>
            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                className="input"
                placeholder="Nombre"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="input"
                placeholder="Precio"
                inputMode="decimal"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
              <button type="submit" className="btn-secondary" disabled={saving}>
                Añadir
              </button>
            </div>
          </form>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={(ticket.products?.length ?? 0) < 1}
            onClick={() => setStep('settings')}
          >
            Continuar
          </button>
        </>
      )}

      {step === 'settings' && (
        <>
          <div className="card space-y-5">
            <div>
              <h3 className="font-semibold text-foreground dark:text-white">Propina global</h3>
              <p className="text-sm text-foreground-muted dark:text-slate-400">
                Se aplicará a todos los participantes.
              </p>
            </div>
            <GlobalTipSelector value={globalTip} onChange={setGlobalTip} />
          </div>

          <div className="card space-y-3">
            <label className="label" htmlFor="expected-count">
              Participantes esperados (opcional)
            </label>
            <input
              id="expected-count"
              className="input sm:max-w-[120px]"
              type="number"
              min={1}
              max={99}
              placeholder="Ej. 5"
              value={expectedCount}
              onChange={(e) => setExpectedCount(e.target.value)}
            />
          </div>

          <div className="card space-y-4">
            <div>
              <h3 className="font-semibold text-foreground dark:text-white">Tu perfil</h3>
              <p className="text-sm text-foreground-muted dark:text-slate-400">
                También seleccionarás tu consumo en el siguiente paso.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="admin-name">
                Nombre (opcional)
              </label>
              <input
                id="admin-name"
                className="input"
                placeholder="Participante 1"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={saving}
              onClick={() => void saveSettingsAndContinue()}
            >
              {saving ? 'Guardando…' : 'Continuar'}
            </button>
          </div>
        </>
      )}

      {step === 'selection' && (
        <>
          <div className="card space-y-2">
            <h3 className="font-semibold text-foreground dark:text-white">Tu consumo</h3>
            <p className="text-sm text-foreground-muted dark:text-slate-400">
              Toca los productos que consumiste. Los demás los elegirán al unirse.
            </p>
            <p className="text-sm font-medium">
              Seleccionados: {adminSelectedIds.size} · Propina {globalTip}%
            </p>
          </div>

          <div className="space-y-2">
            {(ticket.products ?? []).map((product) => (
              <AdminProductSelectCard
                key={product.id}
                product={product}
                selected={adminSelectedIds.has(product.id)}
                disabled={saving}
                onToggle={() => void toggleAdminProduct(product.id)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={saving}
              onClick={() => void handleStartDivision()}
            >
              {saving ? 'Iniciando…' : 'Iniciar división'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
