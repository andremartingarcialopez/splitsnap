type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps) {
  return (
    <div
      className="card flex min-h-[12rem] flex-col items-center justify-center gap-4 py-10 text-center"
      role="alert"
    >
      <p className="max-w-md text-sm text-destructive">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary touch-target" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
