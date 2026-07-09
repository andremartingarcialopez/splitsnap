import {
  getParticipantSessionDisplay,
  type ParticipantSessionTone,
} from '../utils/statusLabels';

const TONE_CLASS: Record<ParticipantSessionTone, string> = {
  neutral:
    'bg-surface-muted text-foreground-muted dark:bg-slate-800 dark:text-slate-400',
  selecting:
    'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
};

type ParticipantSessionBadgeProps = {
  sessionStatus?: string | null;
  className?: string;
};

/** Estado del participante: pill con color de fondo (sin icono circular). */
export function ParticipantSessionBadge({
  sessionStatus,
  className = '',
}: ParticipantSessionBadgeProps) {
  const { label, tone } = getParticipantSessionDisplay(sessionStatus);

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
