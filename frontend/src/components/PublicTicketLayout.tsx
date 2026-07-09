import type { ReactNode } from 'react';

type PublicTicketLayoutProps = {
  children: ReactNode;
};

export function PublicTicketLayout({ children }: PublicTicketLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-slate-950">
      <header className="border-b border-border bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
            <span className="text-lg">🍽️</span>
          </div>
          <div>
            <p className="font-bold text-foreground dark:text-white">SplitSnap</p>
            <p className="text-xs text-foreground-muted dark:text-slate-400">
              Divide tu consumo
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6 pb-28">{children}</main>
    </div>
  );
}
