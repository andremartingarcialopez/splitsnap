import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backTo?: string;
  onBack?: () => void;
};

export function PageHeader({ title, subtitle, actions, backTo, onBack }: PageHeaderProps) {
  const showBack = backTo != null || onBack != null;

  return (
    <header className="space-y-2">
      {showBack && <BackButton to={backTo} onClick={onBack} className="-ml-2" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
