type Props = {
  connected: boolean;
};

export function LiveConnectionBadge({ connected }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        connected
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-surface-muted text-foreground-muted dark:bg-slate-800 dark:text-slate-400'
      }`}
      title={connected ? 'Sincronización en vivo activa' : 'Reconectando…'}
    >
      <span
        className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
        aria-hidden
      />
      {connected ? 'En vivo' : 'Conectando…'}
    </span>
  );
}
