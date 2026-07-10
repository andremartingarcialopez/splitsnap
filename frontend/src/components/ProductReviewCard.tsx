import { useState } from 'react';
import { AppIcon } from './AppIcon';
import { faDivide, faTrashCan } from '../icons';
import type { Product } from '../types/domain';
import { formatMoney } from '../utils/money';
import { unitPriceForSplit } from '../utils/splitProductLine';

type ProductReviewCardProps = {
  product: Product;
  saving?: boolean;
  onSave: (input: { name: string; unitPrice: number }) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onSplit: (quantity: number) => Promise<void>;
};

export function ProductReviewCard({
  product,
  saving = false,
  onSave,
  onDelete,
  onDuplicate,
  onSplit,
}: ProductReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitQty, setSplitQty] = useState('2');
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.unitPrice));

  const splitCount = Math.floor(Number(splitQty));
  const splitPreview =
    splitOpen && splitCount >= 2 && !Number.isNaN(splitCount)
      ? unitPriceForSplit(product.unitPrice, splitCount)
      : null;

  async function handleSave() {
    const unitPrice = Number(price);
    if (!name.trim() || Number.isNaN(unitPrice) || unitPrice <= 0) return;
    await onSave({ name: name.trim(), unitPrice });
    setEditing(false);
  }

  async function handleSplitConfirm() {
    if (splitCount < 2 || Number.isNaN(splitCount)) return;
    await onSplit(splitCount);
    setSplitOpen(false);
    setSplitQty('2');
  }

  function closeSplit() {
    setSplitOpen(false);
    setSplitQty('2');
  }

  return (
    <article className="rounded-2xl border border-border bg-surface-muted/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      {editing ? (
        <div className="space-y-3">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
          />
          <input
            className="input"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Precio"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary btn-sm" disabled={saving} onClick={() => void handleSave()}>
              Guardar
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                setName(product.name);
                setPrice(String(product.unitPrice));
                setEditing(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-foreground dark:text-white">
                {product.emoji ? `${product.emoji} ` : ''}
                {product.name}
              </p>
              <p className="mt-1 text-lg font-bold text-primary dark:text-primary-light">
                {formatMoney(product.unitPrice)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary btn-sm" disabled={saving} onClick={() => setEditing(true)}>
              Editar
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={saving} onClick={() => void onDuplicate()}>
              Duplicar
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm touch-target inline-flex items-center justify-center px-3"
              disabled={saving}
              aria-label={`Dividir ${product.name} en unidades`}
              aria-expanded={splitOpen}
              onClick={() => setSplitOpen((open) => !open)}
            >
              <AppIcon icon={faDivide} size="sm" />
            </button>
            <button
              type="button"
              className="btn-danger btn-sm touch-target inline-flex items-center justify-center px-3"
              disabled={saving}
              aria-label={`Eliminar ${product.name}`}
              onClick={() => void onDelete()}
            >
              <AppIcon icon={faTrashCan} size="sm" />
            </button>
          </div>

          {splitOpen && (
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm font-medium text-foreground dark:text-white">Dividir en unidades</p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[88px] flex-1 text-sm">
                  <span className="mb-1 block text-xs text-foreground-muted">Cantidad</span>
                  <input
                    className="input py-2"
                    type="number"
                    min={2}
                    max={99}
                    inputMode="numeric"
                    value={splitQty}
                    disabled={saving}
                    onChange={(e) => setSplitQty(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn-primary btn-sm shrink-0"
                  disabled={saving || splitCount < 2 || Number.isNaN(splitCount)}
                  onClick={() => void handleSplitConfirm()}
                >
                  Dividir
                </button>
                <button type="button" className="btn-ghost btn-sm shrink-0" disabled={saving} onClick={closeSplit}>
                  Cancelar
                </button>
              </div>
              {splitPreview != null && (
                <p className="text-xs text-foreground-muted dark:text-slate-400">
                  {splitCount} × {product.name} — {formatMoney(splitPreview)} c/u
                </p>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}
