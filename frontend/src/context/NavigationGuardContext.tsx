import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** `true` = permitir salir (y ya se hizo cleanup si aplica). */
export type NavigationGuardFn = () => Promise<boolean>;

type NavigationGuardContextValue = {
  setGuard: (fn: NavigationGuardFn | null) => void;
  tryNavigate: (to: string) => Promise<void>;
};

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const guardRef = useRef<NavigationGuardFn | null>(null);

  const setGuard = useCallback((fn: NavigationGuardFn | null) => {
    guardRef.current = fn;
  }, []);

  const tryNavigate = useCallback(
    async (to: string) => {
      const target = to.split('?')[0] || to;
      if (target === location.pathname) return;

      const guard = guardRef.current;
      if (guard) {
        const allowed = await guard();
        if (!allowed) return;
      }
      navigate(to);
    },
    [location.pathname, navigate],
  );

  const value = useMemo(() => ({ setGuard, tryNavigate }), [setGuard, tryNavigate]);

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error('useNavigationGuard debe usarse dentro de NavigationGuardProvider');
  }
  return ctx;
}
