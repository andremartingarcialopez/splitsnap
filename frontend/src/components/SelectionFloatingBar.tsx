import { formatMoney } from '../utils/money';

type Props = {
  productCount: number;
  subtotal: number;
  total: number;
  disabled?: boolean;
  busy?: boolean;
  onContinue: () => void;
};

export function SelectionFloatingBar({
  productCount,
  subtotal,
  total,
  disabled = false,
  busy = false,
  onContinue,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Mi selección
          </p>
          <p className="text-sm text-foreground dark:text-white">
            {productCount} producto{productCount === 1 ? '' : 's'} · Subtotal productos{' '}
            {formatMoney(subtotal)}
          </p>
          <p className="text-base font-bold text-primary dark:text-primary-light">
            {formatMoney(total)}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0 px-5 py-3"
          disabled={disabled || busy}
          onClick={onContinue}
        >
          {busy ? '…' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
