import { FormEvent, useEffect, useState } from 'react';
import type { Group, Participant } from '../types/domain';
import type { ParticipantFormValues } from './ParticipantForm';
import { ParticipantPicker } from './ParticipantPicker';

export type GroupFormValues = {
  name: string;
  description: string;
  participantIds: string[];
};

type GroupFormProps = {
  initial?: Group | null;
  participants: Participant[];
  submitting?: boolean;
  creatingParticipant?: boolean;
  error?: string | null;
  onCreateParticipant?: (values: ParticipantFormValues) => Promise<Participant>;
  onSubmit: (values: GroupFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function GroupForm({
  initial,
  participants,
  submitting = false,
  creatingParticipant = false,
  error,
  onCreateParticipant,
  onSubmit,
  onCancel,
}: GroupFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setSelectedParticipantIds(initial?.participants?.map((p) => p.id) ?? []);
    setLocalError(null);
  }, [initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError('El nombre es obligatorio.');
      return;
    }
    if (trimmed.length > 100) {
      setLocalError('El nombre no puede superar 100 caracteres.');
      return;
    }
    if (description.length > 255) {
      setLocalError('La descripción no puede superar 255 caracteres.');
      return;
    }
    setLocalError(null);
    await onSubmit({
      name: trimmed,
      description: description.trim(),
      participantIds: selectedParticipantIds,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="label" htmlFor="group-name">
          Nombre *
        </label>
        <input
          id="group-name"
          className="input"
          value={name}
          maxLength={100}
          placeholder="Ej. Amigos del viernes"
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="group-description">
          Descripción
        </label>
        <textarea
          id="group-description"
          className="input min-h-[96px] resize-y"
          value={description}
          maxLength={255}
          placeholder="Opcional"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ParticipantPicker
        participants={participants}
        selectedIds={selectedParticipantIds}
        onChange={setSelectedParticipantIds}
        onCreateParticipant={onCreateParticipant}
        creating={creatingParticipant}
        disabled={submitting}
      />

      {(localError || error) && (
        <p className="text-sm text-destructive">{localError || error}</p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear grupo'}
        </button>
      </div>
    </form>
  );
}
