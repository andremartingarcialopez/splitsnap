import { useRef } from 'react';
import { useCameraAvailable } from '../hooks/useCameraAvailable';

const ACCEPT = 'image/jpeg,image/jpg,image/png';

type TicketImageSourcePickerProps = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Botones apilados dentro de la zona de subida. */
  variant?: 'stacked' | 'row';
};

/** Elige cámara (si existe) o galería para escanear un ticket. */
export function TicketImageSourcePicker({
  onFileSelected,
  disabled = false,
  idPrefix = 'ticket-image',
  variant = 'stacked',
}: TicketImageSourcePickerProps) {
  const hasCamera = useCameraAvailable();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    onFileSelected(file);
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  }

  const layoutClass =
    variant === 'row'
      ? 'flex flex-col gap-2 sm:flex-row sm:justify-center'
      : 'flex w-full flex-col gap-2';

  return (
    <>
      <div className={layoutClass}>
        {hasCamera === true && (
          <button
            type="button"
            className="btn-primary w-full"
            disabled={disabled}
            onClick={() => cameraRef.current?.click()}
          >
            Usar cámara
          </button>
        )}
        <button
          type="button"
          className={hasCamera === true ? 'btn-secondary w-full' : 'btn-primary w-full'}
          disabled={disabled}
          onClick={() => galleryRef.current?.click()}
        >
          Subir foto
        </button>
      </div>

      <input
        ref={galleryRef}
        id={`${idPrefix}-gallery`}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        id={`${idPrefix}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );
}
