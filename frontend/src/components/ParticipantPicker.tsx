import { useState } from 'react';
import type { Participant } from '../types/domain';
import type { ParticipantFormValues } from './ParticipantForm';
import { ParticipantForm } from './ParticipantForm';

type ParticipantPickerProps = {
  participants: Participant[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateParticipant?: (values: ParticipantFormValues) => Promise<Participant>;
  creating?: boolean;
  disabled?: boolean;
};

function participantLabel(p: Participant) {
  return p.name?.trim() || `Participante ${p.id.slice(0, 8)}`;
}

/** Selector multi de participantes con creación inline opcional. */
export function ParticipantPicker({
  participants,
  selectedIds,
  onChange,
  onCreateParticipant,
  creating = false,
  disabled = false,
}: ParticipantPickerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function toggle(id: string) {
    if (disabled) return;
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  async function handleCreate(values: ParticipantFormValues) {
    if (!onCreateParticipant) return;
    setCreateError(null);
    try {
      const created = await onCreateParticipant(values);
      onChange([...selectedIds, created.id]);
      setShowCreate(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear el participante.');
      throw err;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="label mb-0">Participantes del grupo</label>
        {onCreateParticipant && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={disabled || creating}
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? 'Cancelar' : '+ Nuevo'}
          </button>
        )}
      </div>

      {participants.length === 0 ? (
        <p className="text-sm text-foreground-muted dark:text-slate-400">
          No hay participantes registrados. Crea uno con «+ Nuevo» para añadirlo al grupo.
        </p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-border bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
          {participants.map((p) => (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#F3F4F6] dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedIds.includes(p.id)}
                  disabled={disabled}
                  onChange={() => toggle(p.id)}
                />
                <span className="flex-1 text-sm text-foreground dark:text-slate-200">
                  {participantLabel(p)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selectedIds.length > 0 && (
        <p className="text-xs text-foreground-muted dark:text-slate-500">
          {selectedIds.length} seleccionado{selectedIds.length === 1 ? '' : 's'}
        </p>
      )}

      {showCreate && onCreateParticipant && (
        <div className="rounded-2xl border border-border bg-[#F3F4F6]/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <ParticipantForm
            embedded
            submitting={creating}
            error={createError}
            onCancel={() => {
              setShowCreate(false);
              setCreateError(null);
            }}
            onSubmit={handleCreate}
          />
        </div>
      )}
    </div>
  );
}
