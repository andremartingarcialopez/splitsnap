import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/useIsMobile';

export type ProductScrollIndexItem = {
  id: string;
  label: string;
};

const DEFAULT_MIN_ITEMS = 8;

export function productScrollTargetId(id: string): string {
  return `product-scroll-${id}`;
}

type ProductScrollAnchorProps = {
  productId: string;
  children: ReactNode;
};

/** Ancla de scroll para saltar desde el índice. */
export function ProductScrollAnchor({ productId, children }: ProductScrollAnchorProps) {
  return (
    <div id={productScrollTargetId(productId)} className="scroll-mt-3">
      {children}
    </div>
  );
}

type ProductScrollIndexProps = {
  items: ProductScrollIndexItem[];
  minItems?: number;
  /** Margen inferior (px) para no tapar barras flotantes. */
  bottomInset?: number;
};

/**
 * Índice lateral móvil: marcas verticales + panel inferior para saltar a un producto.
 */
export function ProductScrollIndex({
  items,
  minItems = DEFAULT_MIN_ITEMS,
  bottomInset = 24,
}: ProductScrollIndexProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile || items.length < minItems) return null;

  function jumpTo(id: string) {
    document.getElementById(productScrollTargetId(id))?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setOpen(false);
  }

  const rail = (
    <button
      type="button"
      className="fixed right-1.5 z-[38] flex max-h-[min(220px,45dvh)] flex-col items-center justify-between gap-px overflow-hidden rounded-full border border-white/50 bg-white/70 px-1 py-2 shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75 md:hidden"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        marginBottom: bottomInset,
      }}
      aria-label="Ir a producto"
      onClick={() => setOpen(true)}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="block h-0.5 w-2.5 shrink-0 rounded-full bg-primary/45 dark:bg-primary-light/50"
          aria-hidden
        />
      ))}
    </button>
  );

  const sheet =
    open &&
    createPortal(
      <div className="fixed inset-0 z-[45] md:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          aria-label="Cerrar índice"
          onClick={() => setOpen(false)}
        />
        <div
          className="absolute inset-x-0 bottom-0 max-h-[min(70dvh,420px)] rounded-t-3xl border border-border bg-white/95 p-4 shadow-card-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
          style={{ paddingBottom: `max(1rem, ${bottomInset}px)` }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-scroll-index-title"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border dark:bg-slate-700" />
          <h2
            id="product-scroll-index-title"
            className="text-sm font-semibold text-foreground dark:text-white"
          >
            Ir a producto
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted dark:text-slate-400">
            {items.length} productos
          </p>
          <ul className="mt-3 max-h-[min(52dvh,320px)] space-y-1 overflow-y-auto overscroll-contain pr-0.5">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-surface-muted dark:hover:bg-slate-800/80"
                  onClick={() => jumpTo(item.id)}
                >
                  <span className="w-5 shrink-0 text-xs font-medium text-foreground-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground dark:text-white">
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      {rail}
      {sheet}
    </>
  );
}
