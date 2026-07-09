import { useState } from 'react';
import type { Product } from '../types/domain';
import { formatMoney } from '../utils/money';

type ProductReviewCardProps = {
  product: Product;
  saving?: boolean;
  onSave: (input: { name: string; unitPrice: number }) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
};

export function ProductReviewCard({
  product,
  saving = false,
  onSave,
  onDelete,
  onDuplicate,
}: ProductReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.unitPrice));

  async function handleSave() {
    const unitPrice = Number(price);
    if (!name.trim() || Number.isNaN(unitPrice) || unitPrice <= 0) return;
    await onSave({ name: name.trim(), unitPrice });
    setEditing(false);
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary btn-sm" disabled={saving} onClick={() => setEditing(true)}>
              Editar
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={saving} onClick={() => void onDuplicate()}>
              Duplicar
            </button>
            <button type="button" className="btn-ghost btn-sm text-destructive" disabled={saving} onClick={() => void onDelete()}>
              Eliminar
            </button>
          </div>
        </>
      )}
    </article>
  );
}
