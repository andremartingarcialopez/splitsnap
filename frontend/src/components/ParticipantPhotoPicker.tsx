import { useEffect, useRef, useState } from 'react';

import { AppIcon } from './AppIcon';
import { faUser } from '../icons';
import { resolveMediaUrl } from '../utils/mediaUrl';

const ACCEPT = 'image/jpeg,image/jpg,image/png';

type ParticipantPhotoPickerProps = {
  /** URL guardada (p. ej. /uploads/participants/...) */
  photoUrl: string | null;
  onChange: (next: { photoUrl: string | null; photoFile: File | null }) => void;
  disabled?: boolean;
  idPrefix?: string;
};

/** Selector de foto: cámara o galería (input file nativo en móvil). */
export function ParticipantPhotoPicker({
  photoUrl,
  onChange,
  disabled = false,
  idPrefix = 'participant-photo',
}: ParticipantPhotoPickerProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);

  // Vista previa: archivo nuevo > URL existente
  useEffect(() => {
    if (localFile) {
      const blobUrl = URL.createObjectURL(localFile);
      setPreviewUrl(blobUrl);
      return () => URL.revokeObjectURL(blobUrl);
    }
    setPreviewUrl(resolveMediaUrl(photoUrl) ?? null);
  }, [localFile, photoUrl]);

  function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    setLocalFile(file);
    onChange({ photoUrl: null, photoFile: file });
  }

  function clearPhoto() {
    if (disabled) return;
    setLocalFile(null);
    onChange({ photoUrl: null, photoFile: null });
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  }

  const hasPhoto = Boolean(previewUrl);

  return (
    <div className="space-y-3">
      <p className="label mb-0">Foto</p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface-muted dark:border-slate-700 dark:bg-slate-800/50 ${
            hasPhoto ? 'border-solid' : ''
          }`}
        >
          {hasPhoto ? (
            <img
              src={previewUrl!}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          ) : (
            <AppIcon icon={faUser} size="xl" className="text-foreground-muted dark:text-slate-500" />
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <button
            type="button"
            className="btn-primary w-full sm:w-auto"
            disabled={disabled}
            onClick={() => cameraRef.current?.click()}
          >
            Tomar foto
          </button>
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            disabled={disabled}
            onClick={() => galleryRef.current?.click()}
          >
            Elegir de galería
          </button>
          {hasPhoto && (
            <button
              type="button"
              className="btn-ghost w-full text-destructive sm:w-auto"
              disabled={disabled}
              onClick={clearPhoto}
            >
              Quitar foto
            </button>
          )}
        </div>
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
        capture="user"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <p className="text-xs text-muted">JPG o PNG · máximo 5 MB. Nombre o foto son obligatorios.</p>
    </div>
  );
}
