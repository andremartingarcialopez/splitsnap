import { FormEvent, useEffect, useState } from 'react';
import type { Participant } from '../types/domain';
import { ParticipantPhotoPicker } from './ParticipantPhotoPicker';

export type ParticipantFormValues = {
  name: string;
  photoUrl: string | null;
  photoFile: File | null;
};

type ParticipantFormProps = {
  initial?: Participant | null;
  submitting?: boolean;
  error?: string | null;
  /** Evita <form> anidado cuando se usa dentro de otro formulario. */
  embedded?: boolean;
  onSubmit: (values: ParticipantFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function ParticipantForm({
  initial,
  submitting = false,
  error,
  embedded = false,
  onSubmit,
  onCancel,
}: ParticipantFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const idPrefix = embedded ? 'embedded-participant' : 'participant';

  useEffect(() => {
    setName(initial?.name ?? '');
    setPhotoUrl(initial?.photoUrl ?? null);
    setPhotoFile(null);
    setLocalError(null);
  }, [initial]);

  async function submitValues() {
    const trimmedName = name.trim();
    const hasPhoto = Boolean(photoFile || photoUrl);

    if (!trimmedName && !hasPhoto) {
      setLocalError('Indica al menos un nombre o una foto.');
      return;
    }
    if (trimmedName.length > 100) {
      setLocalError('El nombre no puede superar 100 caracteres.');
      return;
    }

    setLocalError(null);
    await onSubmit({
      name: trimmedName,
      photoUrl,
      photoFile,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submitValues();
  }

  const fields = (
    <>
      <ParticipantPhotoPicker
        idPrefix={idPrefix}
        photoUrl={photoUrl}
        disabled={submitting}
        onChange={({ photoUrl: nextUrl, photoFile: nextFile }) => {
          setPhotoUrl(nextUrl);
          setPhotoFile(nextFile);
        }}
      />
      <div>
        <label className="label" htmlFor={`${idPrefix}-name`}>
          Nombre
        </label>
        <input
          id={`${idPrefix}-name`}
          className="input"
          value={name}
          maxLength={100}
          placeholder="Ej. Ana"
          onChange={(e) => setName(e.target.value)}
          autoFocus={!embedded}
        />
      </div>
      {(localError || error) && (
        <p className="text-sm text-destructive">{localError || error}</p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button
          type={embedded ? 'button' : 'submit'}
          className="btn-primary"
          disabled={submitting}
          onClick={embedded ? () => void submitValues() : undefined}
        >
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear participante'}
        </button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{fields}</div>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {fields}
    </form>
  );
}
