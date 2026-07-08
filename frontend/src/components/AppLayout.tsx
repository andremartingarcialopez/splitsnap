import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    to: '/tickets',
    label: 'Tickets',
    end: false,
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/tickets/new',
    label: 'Nuevo',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'Historial',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/groups',
    label: 'Grupos',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/participants',
    label: 'Participantes',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item-inactive')}
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface dark:border-slate-800 dark:bg-slate-950 lg:flex">
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-foreground dark:text-white">SplitSnap</p>
              <p className="text-[11px] text-foreground-muted dark:text-slate-500">Divide cuentas fácil</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-border p-4 dark:border-slate-800">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 dark:from-primary/20 dark:to-accent/10">
            <p className="text-xs font-semibold text-primary dark:text-primary-light">Tip</p>
            <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
              Sube una foto del ticket y deja que la IA extraiga los productos.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header + content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <span className="text-base font-bold text-foreground dark:text-white">SplitSnap</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-hidden px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <Outlet />
        </main>

        {/* Bottom nav — mobile */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
          aria-label="Navegación móvil"
        >
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'touch-target flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] font-medium transition',
                    isActive
                      ? 'text-primary dark:text-primary-light'
                      : 'text-foreground-muted dark:text-slate-500',
                  ].join(' ')
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
