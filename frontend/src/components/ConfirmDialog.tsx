type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
};

/** Diálogo de confirmación alineado al design system (reemplaza window.confirm). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center dark:bg-black/60"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md shadow-card-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="page-title text-lg">
          {title}
        </h2>
        <p id="confirm-message" className="mt-3 whitespace-pre-line text-sm text-foreground-muted dark:text-slate-400">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary form-row-action sm:w-auto" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`form-row-action sm:w-auto ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
