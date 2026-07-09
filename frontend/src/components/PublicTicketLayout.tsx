import type { ReactNode } from 'react';
import { AppIcon } from './AppIcon';
import { faUtensils } from '../icons';

type PublicTicketLayoutProps = {
  children: ReactNode;
};

export function PublicTicketLayout({ children }: PublicTicketLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-surface-light dark:bg-gradient-surface-dark">
      <header className="glass-chrome border-b px-4 py-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-glow-sm">
              <AppIcon icon={faUtensils} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground dark:text-white">SplitSnap</p>
              <p className="text-xs text-foreground-muted dark:text-slate-400">
                Divide tu consumo
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6 pb-28">{children}</main>
    </div>
  );
}
