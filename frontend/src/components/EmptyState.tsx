import { AppIcon } from './AppIcon';
import { faClipboardList } from '../icons';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted dark:bg-primary/20">
        <AppIcon icon={faClipboardList} size="xl" className="text-primary dark:text-primary-light" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground dark:text-white">{title}</p>
        <p className="mt-2 max-w-md text-sm text-foreground-muted dark:text-slate-400">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="btn-primary mt-2" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
