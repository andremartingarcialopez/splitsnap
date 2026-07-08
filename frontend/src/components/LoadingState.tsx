import { Spinner } from './Spinner';

type LoadingStateProps = {
  label?: string;
  minHeightClass?: string;
};

/** Loading con altura reservada (MDD UI/UX). */
export function LoadingState({
  label = 'Cargando…',
  minHeightClass = 'min-h-[12rem]',
}: LoadingStateProps) {
  return (
    <div className={minHeightClass}>
      <Spinner label={label} />
    </div>
  );
}
