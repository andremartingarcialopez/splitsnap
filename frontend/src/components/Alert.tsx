type AlertProps = {
  tone?: 'error' | 'info' | 'success' | 'warning';
  children: React.ReactNode;
};

const toneClass: Record<NonNullable<AlertProps['tone']>, string> = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  info: 'border-rose-200 bg-primary-muted text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200',
  success:
    'border-emerald-200 bg-success-light text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning:
    'border-amber-200 bg-warning-light text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200',
};

export function Alert({ tone = 'info', children }: AlertProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${toneClass[tone]}`}
      role="alert"
    >
      {children}
    </div>
  );
}
