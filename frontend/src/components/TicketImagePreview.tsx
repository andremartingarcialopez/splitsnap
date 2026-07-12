import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from './AppIcon';
import { faUpRightAndDownLeftFromCenter, faXmark } from '../icons';
import { resolveMediaUrl } from '../utils/mediaUrl';

type TicketImagePreviewProps = {
  imageUrl: string | null | undefined;
  alt?: string;
  className?: string;
  imageClassName?: string;
};

function hasDisplayableImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  return imageUrl.startsWith('/uploads') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
}

export function TicketImagePreview({
  imageUrl,
  alt = 'Ticket',
  className = '',
  imageClassName = 'max-h-48 w-full object-cover object-top sm:max-h-56',
}: TicketImagePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const resolved = resolveMediaUrl(imageUrl);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false);
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  if (!hasDisplayableImage(imageUrl) || !resolved || hidden) return null;

  return (
    <>
      <div className={`card overflow-hidden p-0 ${className}`}>
        <button
          type="button"
          className="group relative block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          onClick={() => setExpanded(true)}
          aria-label="Ampliar foto del ticket"
        >
          <img
            src={resolved}
            alt={alt}
            className={imageClassName}
            onError={() => setHidden(true)}
          />
          <span className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition-colors group-hover:bg-black/70">
            <AppIcon icon={faUpRightAndDownLeftFromCenter} size="sm" />
          </span>
        </button>
      </div>

      {expanded &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Foto del ticket ampliada"
            onClick={() => setExpanded(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              onClick={() => setExpanded(false)}
              aria-label="Cerrar"
            >
              <AppIcon icon={faXmark} />
            </button>
            <img
              src={resolved}
              alt={alt}
              className="max-h-[min(90dvh,90svh)] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
