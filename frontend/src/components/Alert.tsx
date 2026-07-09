type AlertProps = {
  tone?: 'error' | 'info' | 'success' | 'warning';
  children: React.ReactNode;
};

const toneClass: Record<NonNullable<AlertProps['tone']>, string> = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  info: 'border-green-200 bg-primary-muted text-green-900 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200',
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
