import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AppIcon } from './AppIcon';
import { ThemeToggle } from './ThemeToggle';
import { faClock, faHouse, faPlus, faUtensils } from '../icons';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Inicio',
    end: true,
    icon: <AppIcon icon={faHouse} />,
  },
  {
    to: '/scan',
    label: 'Escanear',
    icon: <AppIcon icon={faPlus} />,
  },
  {
    to: '/history',
    label: 'Historial',
    icon: <AppIcon icon={faClock} />,
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

function BrandHomeLink({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
  if (variant === 'desktop') {
    return (
      <NavLink
        to="/"
        end
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition hover:opacity-80"
        aria-label="Ir al inicio"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow-sm">
          <AppIcon icon={faUtensils} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground dark:text-white">SplitSnap</p>
          <p className="text-[11px] text-foreground-muted dark:text-slate-500">Divide cuentas fácil</p>
        </div>
      </NavLink>
    );
  }

  return (
    <NavLink
      to="/"
      end
      className="flex items-center gap-2.5 rounded-xl transition hover:opacity-80"
      aria-label="Ir al inicio"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-glow-sm">
        <AppIcon icon={faUtensils} size="sm" className="text-white" />
      </div>
      <span className="text-base font-bold text-foreground dark:text-white">SplitSnap</span>
    </NavLink>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar — desktop */}
      <aside className="glass-chrome hidden w-64 shrink-0 flex-col border-r lg:flex">
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <BrandHomeLink variant="desktop" />
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-white/40 p-4 dark:border-white/5">
          <div className="card-muted rounded-2xl !p-4">
            <p className="text-xs font-semibold text-primary dark:text-primary-light">Tip</p>
            <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
              Escanea el ticket, revisa con IA y comparte un enlace con tu grupo.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header + content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="glass-chrome sticky top-0 z-40 border-b lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <BrandHomeLink />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-hidden px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <Outlet />
        </main>

        {/* Bottom nav — mobile */}
        <nav
          className="glass-chrome fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 lg:hidden"
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
