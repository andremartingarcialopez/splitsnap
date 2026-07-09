import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from './AppIcon';
import { faXmark } from '../icons';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-[#3d3349]/35 p-4 backdrop-blur-lg backdrop-saturate-150 dark:bg-[#15121f]/65 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center py-2">
        <div
          className="card flex max-h-[min(calc(100dvh-2rem),calc(100svh-2rem))] w-full max-w-lg flex-col overflow-hidden shadow-card-lg sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3 border-b border-border/60 pb-4 dark:border-primary/10">
            <h2 id="modal-title" className="page-title text-xl">
              {title}
            </h2>
            <button
              type="button"
              className="btn-ghost !min-h-[36px] !min-w-[36px] !rounded-full !p-2"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <AppIcon icon={faXmark} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
