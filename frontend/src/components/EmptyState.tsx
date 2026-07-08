type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted dark:bg-primary/20">
        <svg
          className="h-8 w-8 text-primary dark:text-primary-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground dark:text-white">{title}</p>
        <p className="mt-2 max-w-md text-sm text-foreground-muted dark:text-slate-400">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="btn-primary mt-2" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
