import { useEffect, useState } from 'react';

const STEPS = [
  { id: 'ocr', label: 'Detectando texto', delayMs: 800 },
  { id: 'products', label: 'Identificando productos', delayMs: 1800 },
  { id: 'organize', label: 'Organizando información', delayMs: 2800 },
  { id: 'ai', label: 'Interpretando mediante IA', delayMs: 3800 },
] as const;

type ScanProcessingOverlayProps = {
  active: boolean;
};

export function ScanProcessingOverlay({ active }: ScanProcessingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Date.now() - started);
    }, 200);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted text-3xl dark:bg-primary/20">
          📷
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground dark:text-white">
            Analizando ticket…
          </h2>
          <p className="mt-2 text-sm text-foreground-muted dark:text-slate-400">
            Esto puede tardar unos segundos
          </p>
        </div>
        <ul className="space-y-3 text-left">
          {STEPS.map((step) => {
            const done = elapsed >= step.delayMs;
            const current =
              elapsed >= step.delayMs - 400 &&
              (STEPS.find((s) => elapsed < s.delayMs)?.id === step.id || done);
            return (
              <li
                key={step.id}
                className={[
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition',
                  current
                    ? 'bg-primary-muted/60 font-medium text-primary dark:bg-primary/15 dark:text-primary-light'
                    : 'text-foreground-muted dark:text-slate-400',
                ].join(' ')}
              >
                <span className="w-5 shrink-0 text-center">
                  {done ? '✔' : current ? '…' : '○'}
                </span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
