import type { PublicProduct, PublicProductAssignee } from '../types/domain';
import { avatarEmoji } from '../constants/avatars';
import { AppIcon } from './AppIcon';
import { faCheck, faCircle } from '../icons';
import { formatMoney } from '../utils/money';

type ParticipantProductCardProps = {
  product: PublicProduct;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

/** Lista de participantes asignados al producto (nombre + avatar). */
function ProductAssigneeList({
  assignees,
  isShared,
}: {
  assignees: PublicProductAssignee[];
  isShared: boolean;
}) {
  if (!assignees.length) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs text-foreground-muted dark:text-slate-400">
        {isShared ? 'Compartido entre:' : 'Seleccionado por:'}
      </p>
      <ul className="space-y-1">
        {assignees.map((assignee) => (
          <li
            key={assignee.participantId}
            className="flex items-center gap-2 text-xs text-foreground dark:text-slate-200"
          >
            <span className="min-w-0 truncate">{assignee.displayName}</span>
            <ParticipantAvatarBadge avatarId={assignee.avatarId} size="sm" plain />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ParticipantProductCard({
  product,
  selected,
  disabled = false,
  onToggle,
}: ParticipantProductCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={[
        'w-full rounded-2xl border p-4 text-left transition duration-200 active:scale-[0.99]',
        selected
          ? 'border-primary bg-primary-muted/40 ring-2 ring-primary/25 dark:border-primary-light dark:bg-primary/10'
          : 'border-border bg-white dark:border-slate-800 dark:bg-slate-900',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground dark:text-white">
              {product.emoji ? `${product.emoji} ` : ''}
              {product.name}
            </p>
            {product.isShared && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Compartido · {product.assignmentCount}
              </span>
            )}
            {selected && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:text-primary-light">
                Seleccionado
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-bold text-primary dark:text-primary-light">
            {formatMoney(product.unitPrice)}
          </p>
          <ProductAssigneeList assignees={product.assignees} isShared={product.isShared} />
        </div>
        <span
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            selected ? 'bg-primary text-white' : 'border border-border dark:border-slate-700',
          ].join(' ')}
        >
          {selected ? (
            <AppIcon icon={faCheck} size="sm" className="text-white" />
          ) : (
            <AppIcon icon={faCircle} size="sm" className="text-foreground-muted opacity-50" />
          )}
        </span>
      </div>
    </button>
  );
}

export function ParticipantMiniSummary({
  productCount,
  subtotal,
  tip,
  total,
}: {
  productCount: number;
  subtotal: number;
  tip: number;
  total: number;
}) {
  return (
    <div className="rounded-2xl bg-surface-muted px-4 py-3 dark:bg-slate-800/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Mi consumo
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>{productCount} productos</span>
        <span>Subtotal {formatMoney(subtotal)}</span>
        {tip > 0 && <span>Propina {formatMoney(tip)}</span>}
        <span className="font-bold text-primary dark:text-primary-light">
          Total {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}

export function ParticipantAvatarBadge({
  avatarId,
  size = 'md',
  plain = false,
}: {
  avatarId: string | null;
  size?: 'sm' | 'md';
  /** Sin fondo circular (lista de assignees). */
  plain?: boolean;
}) {
  const sizeClass =
    size === 'sm' ? 'h-6 w-6 shrink-0 text-base' : 'h-10 w-10 shrink-0 text-xl';

  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        sizeClass,
        plain ? '' : 'rounded-full bg-primary-muted dark:bg-primary/20',
      ].join(' ')}
    >
      {avatarEmoji(avatarId)}
    </span>
  );
}
