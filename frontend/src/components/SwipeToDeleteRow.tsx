import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';

const DIRECTION_LOCK_PX = 10;
const MIN_TRIGGER_PX = 72;
const TRIGGER_RATIO = 0.32;
const MAX_DRAG_RATIO = 0.5;

type SwipeToDeleteRowProps = {
  children: ReactNode;
  onDelete: () => void;
  /** Botón eliminar visible en pantallas md+ (desktop). */
  desktopDelete?: ReactNode;
};

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 768px)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

export function SwipeToDeleteRow({
  children,
  onDelete,
  desktopDelete,
}: SwipeToDeleteRowProps) {
  const isDesktop = useIsDesktop();
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axisLock = useRef<'x' | 'y' | null>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef(0);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const getLimits = useCallback(() => {
    const width = rowRef.current?.offsetWidth ?? 320;
    return {
      maxDrag: width * MAX_DRAG_RATIO,
      trigger: Math.max(MIN_TRIGGER_PX, width * TRIGGER_RATIO),
    };
  }, []);

  const clamp = useCallback(
    (value: number) => {
      const { maxDrag } = getLimits();
      return Math.max(-maxDrag, Math.min(0, value));
    },
    [getLimits],
  );

  const resetPosition = useCallback(() => setOffset(0), []);

  const handleTouchStart = (event: TouchEvent) => {
    if (isDesktop) return;
    const touch = event.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startOffset.current = offsetRef.current;
    axisLock.current = null;
    draggingRef.current = true;
    suppressClickRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (isDesktop || !draggingRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;

    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (!axisLock.current) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (axisLock.current === 'y') return;

    event.preventDefault();
    suppressClickRef.current = true;
    setOffset(clamp(startOffset.current + dx));
  };

  const handleTouchEnd = () => {
    if (isDesktop) return;
    draggingRef.current = false;
    setIsDragging(false);
    axisLock.current = null;

    const current = offsetRef.current;
    const { trigger } = getLimits();
    resetPosition();

    if (Math.abs(current) >= trigger) {
      suppressClickRef.current = true;
      onDelete();
    }
  };

  const handleClickCapture = (event: MouseEvent) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  if (isDesktop) {
    return (
      <div className="card flex items-stretch gap-2 !p-0 overflow-hidden">
        {children}
        {desktopDelete}
      </div>
    );
  }

  const { trigger } = getLimits();
  const swipeProgress = Math.min(1, Math.abs(offset) / trigger);

  return (
    <div ref={rowRef} className="relative overflow-hidden rounded-3xl">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 pr-5 dark:bg-red-700"
        style={{ width: `${Math.max(20, Math.abs(offset) + 16)}px` }}
        aria-hidden
      >
        <svg
          className="h-5 w-5 text-white transition-opacity"
          style={{ opacity: swipeProgress }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </div>

      <div
        className={[
          'relative touch-pan-y select-none',
          !isDragging ? 'transition-transform duration-200 ease-out' : '',
        ].join(' ')}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={handleClickCapture}
      >
        <div className="card !rounded-3xl !p-0 shadow-card dark:shadow-none">{children}</div>
      </div>
    </div>
  );
}
