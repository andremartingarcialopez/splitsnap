import { useNavigate } from 'react-router-dom';
import { AppIcon } from './AppIcon';
import { faChevronLeft } from '../icons';

type BackButtonProps = {
  /** Ruta explícita; si no se indica, usa historial del navegador. */
  to?: string;
  /** Acción personalizada (p. ej. pasos de un wizard). */
  onClick?: () => void;
  label?: string;
  className?: string;
};

export function BackButton({
  to,
  onClick,
  label = 'Atrás',
  className = '',
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'touch-target inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-2 text-sm font-semibold',
        'text-foreground-muted transition hover:bg-surface-muted hover:text-foreground',
        'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        className,
      ].join(' ')}
      aria-label={label}
    >
      <AppIcon icon={faChevronLeft} />
      <span>{label}</span>
    </button>
  );
}
