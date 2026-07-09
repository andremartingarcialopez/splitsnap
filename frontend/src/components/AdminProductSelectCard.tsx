import type { Product } from '../types/domain';
import { formatMoney } from '../utils/money';

type AdminProductSelectCardProps = {
  product: Product;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function AdminProductSelectCard({
  product,
  selected,
  disabled = false,
  onToggle,
}: AdminProductSelectCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={[
        'w-full rounded-2xl border p-4 text-left transition active:scale-[0.99]',
        selected
          ? 'border-primary bg-primary-muted/50 ring-2 ring-primary/30 dark:border-primary-light dark:bg-primary/10'
          : 'border-border bg-white hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/40',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground dark:text-white">
            {product.emoji ? `${product.emoji} ` : ''}
            {product.name}
          </p>
          <p className="mt-1 text-sm font-bold text-primary dark:text-primary-light">
            {formatMoney(product.unitPrice)}
          </p>
        </div>
        <span
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            selected
              ? 'bg-primary text-white'
              : 'border border-border text-foreground-muted dark:border-slate-700',
          ].join(' ')}
        >
          {selected ? '✓' : '+'}
        </span>
      </div>
    </button>
  );
}
