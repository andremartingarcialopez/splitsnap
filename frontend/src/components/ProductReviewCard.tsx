import { useMemo, useState } from 'react';
import { AppIcon } from './AppIcon';
import { Modal } from './Modal';
import { faTrashCan } from '../icons';
import type { Product } from '../types/domain';
import { formatMoney } from '../utils/money';
import {
  countRelatedProducts,
  type ProductUpdateScope,
} from '../utils/relatedProducts';
import { unitPriceForSplit } from '../utils/splitProductLine';

type ProductReviewCardProps = {
  product: Product;
  allProducts: Product[];
  saving?: boolean;
  onSave: (input: {
    name: string;
    unitPrice: number;
    scope: ProductUpdateScope;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onSplit: (quantity: number) => Promise<void>;
};

export function ProductReviewCard({
  product,
  allProducts,
  saving = false,
  onSave,
  onDelete,
  onDuplicate,
  onSplit,
}: ProductReviewCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [splitQty, setSplitQty] = useState('2');
  const [applyScope, setApplyScope] = useState<ProductUpdateScope>('single');
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.unitPrice));

  const relatedCount = useMemo(
    () => countRelatedProducts(product, allProducts),
    [product, allProducts],
  );

  const splitCount = Math.floor(Number(splitQty));
  const splitPreview =
    splitCount >= 2 && !Number.isNaN(splitCount)
      ? unitPriceForSplit(product.unitPrice, splitCount)
      : null;

  function openModal() {
    setName(product.name);
    setPrice(String(product.unitPrice));
    setSplitQty('2');
    setApplyScope(relatedCount > 1 ? 'group' : 'single');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSave() {
    const unitPrice = Number(price);
    if (!name.trim() || Number.isNaN(unitPrice) || unitPrice <= 0) return;
    const scope = relatedCount > 1 ? applyScope : 'single';
    await onSave({ name: name.trim(), unitPrice, scope });
    closeModal();
  }

  async function handleSplitConfirm() {
    if (splitCount < 2 || Number.isNaN(splitCount)) return;
    await onSplit(splitCount);
    closeModal();
  }

  async function handleDuplicate() {
    await onDuplicate();
    closeModal();
  }

  return (
    <>
      <article className="rounded-2xl border border-border bg-surface-muted/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
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
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary btn-sm min-h-[44px] flex-1"
            disabled={saving}
            onClick={openModal}
          >
            Editar
          </button>
          <button
            type="button"
            className="btn-danger btn-sm touch-target inline-flex min-h-[44px] items-center justify-center px-3"
            disabled={saving}
            aria-label={`Eliminar ${product.name}`}
            onClick={() => void onDelete()}
          >
            <AppIcon icon={faTrashCan} size="sm" />
          </button>
        </div>
      </article>

      <Modal open={modalOpen} title="Editar producto" onClose={closeModal}>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-1 pr-0.5">
          <p className="text-sm text-foreground-muted dark:text-slate-400">
            {product.name} · {formatMoney(product.unitPrice)}
          </p>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground dark:text-white">Datos</h3>
            <input
              className="input"
              value={name}
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
            />
            <input
              className="input"
              inputMode="decimal"
              value={price}
              disabled={saving}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Precio"
            />

            {relatedCount > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground-muted">Aplicar cambio a</p>
                <div className="segmented flex w-full">
                  <button
                    type="button"
                    className={
                      applyScope === 'single' ? 'segmented-btn-active flex-1' : 'segmented-btn-inactive flex-1'
                    }
                    disabled={saving}
                    onClick={() => setApplyScope('single')}
                  >
                    Solo este
                  </button>
                  <button
                    type="button"
                    className={
                      applyScope === 'group' ? 'segmented-btn-active flex-1' : 'segmented-btn-inactive flex-1'
                    }
                    disabled={saving}
                    onClick={() => setApplyScope('group')}
                  >
                    Todos ({relatedCount})
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-primary w-full"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </section>

          <section className="space-y-3 border-t border-border pt-4 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-foreground dark:text-white">
                Dividir en unidades
              </h3>
              <p className="mt-0.5 text-xs text-foreground-muted dark:text-slate-400">
                Si en el ticket eran varios del mismo producto.
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-foreground-muted">Cantidad</span>
              <input
                className="input"
                type="number"
                min={2}
                max={99}
                inputMode="numeric"
                value={splitQty}
                disabled={saving}
                onChange={(e) => setSplitQty(e.target.value)}
              />
            </label>
            {splitPreview != null && (
              <p className="text-xs text-foreground-muted dark:text-slate-400">
                {splitCount} × {product.name} — {formatMoney(splitPreview)} c/u
              </p>
            )}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={saving || splitCount < 2 || Number.isNaN(splitCount)}
              onClick={() => void handleSplitConfirm()}
            >
              Dividir en {splitCount >= 2 ? splitCount : '…'} productos
            </button>
          </section>

          <section className="space-y-2 border-t border-border pt-4 dark:border-slate-800">
            <p className="text-xs text-foreground-muted dark:text-slate-400">
              Crear otra línea igual ({formatMoney(product.unitPrice)}).
            </p>
            <button
              type="button"
              className="btn-primary w-full"
              disabled={saving}
              onClick={() => void handleDuplicate()}
            >
              Duplicar producto
            </button>
          </section>
        </div>
      </Modal>
    </>
  );
}
