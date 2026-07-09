import { Modal } from './Modal';
import { avatarEmoji } from '../constants/avatars';
import type { ParticipantSummary, Product, TicketParticipantLink } from '../types/domain';
import { getParticipantProductLines } from '../utils/participantConsumption';
import { formatMoney } from '../utils/money';

type ParticipantConsumptionModalProps = {
  open: boolean;
  participant: ParticipantSummary | null;
  products: Product[];
  ticketParticipants?: TicketParticipantLink[];
  sessionStatus?: string;
  busyId: string | null;
  onClose: () => void;
  onTogglePayment: (ticketParticipantId: string, currentStatus: string | undefined) => void;
};

export function ParticipantConsumptionModal({
  open,
  participant,
  products,
  ticketParticipants,
  sessionStatus,
  busyId,
  onClose,
  onTogglePayment,
}: ParticipantConsumptionModalProps) {
  if (!participant) return null;

  const tpId = participant.ticketParticipantId;
  const meta = ticketParticipants?.find((tp) => tp.participantId === participant.participantId);
  const displayName =
    meta?.displayName ?? meta?.participant.name ?? participant.name ?? 'Participante';
  const isPaid = participant.paymentStatus === 'PAID';
  const lines = getParticipantProductLines(products, participant.participantId);

  return (
    <Modal open={open} title={displayName} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {avatarEmoji(meta?.avatarId)}
          </span>
          <span
            className={[
              'rounded-pill px-3 py-1 text-xs font-semibold',
              isPaid
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
            ].join(' ')}
          >
            {isPaid ? '✓ Pagado' : 'Pendiente de pago'}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <h3 className="mb-2 shrink-0 text-sm font-semibold text-foreground dark:text-white">
            Consumo
          </h3>
          {lines.length === 0 ? (
            <p className="text-sm text-foreground-muted dark:text-slate-400">
              Sin productos asignados.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
              {lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2 text-sm dark:bg-slate-800/50"
                >
                  <span className="text-foreground dark:text-white">
                    {line.name}
                    {line.shareLabel ? (
                      <span className="ml-1 text-xs text-foreground-muted">({line.shareLabel})</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-medium">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <dl className="shrink-0 space-y-1.5 border-t border-border pt-3 text-sm dark:border-slate-800">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">Subtotal productos</dt>
            <dd>{formatMoney(participant.subtotal)}</dd>
          </div>
          {participant.taxPortion > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground-muted">Impuesto</dt>
              <dd>{formatMoney(participant.taxPortion)}</dd>
            </div>
          )}
          {participant.discountPortion > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground-muted">Descuento</dt>
              <dd>−{formatMoney(participant.discountPortion)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">
              Propina ({participant.tipPercentage}%)
            </dt>
            <dd>{formatMoney(participant.tip)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold dark:border-slate-800">
            <dt className="text-foreground dark:text-white">Total</dt>
            <dd className="text-primary dark:text-primary-light">{formatMoney(participant.total)}</dd>
          </div>
        </dl>

        {sessionStatus !== 'FINISHED' && tpId && (
          <button
            type="button"
            className={`shrink-0 ${isPaid ? 'btn-secondary w-full' : 'btn-primary w-full'}`}
            disabled={busyId === tpId}
            onClick={() => onTogglePayment(tpId, participant.paymentStatus)}
          >
            {busyId === tpId ? 'Actualizando…' : isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
          </button>
        )}
      </div>
    </Modal>
  );
}
