export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-3 py-12 text-foreground-muted dark:text-slate-400">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
