import type { PublicProduct } from '../types/domain';
import { avatarEmoji } from '../constants/avatars';
import { formatMoney } from '../utils/money';

type ParticipantProductCardProps = {
  product: PublicProduct;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

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
          {product.assignees.length > 0 && (
            <p className="mt-2 text-xs text-foreground-muted dark:text-slate-400">
              {product.isShared ? 'Compartido entre: ' : 'Seleccionado por: '}
              {product.assignees.map((a) => a.displayName).join(', ')}
            </p>
          )}
        </div>
        <span
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg',
            selected ? 'bg-primary text-white' : 'border border-border dark:border-slate-700',
          ].join(' ')}
        >
          {selected ? '✓' : '○'}
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

export function ParticipantAvatarBadge({ avatarId }: { avatarId: string | null }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-muted text-xl dark:bg-primary/20">
      {avatarEmoji(avatarId)}
    </span>
  );
}
