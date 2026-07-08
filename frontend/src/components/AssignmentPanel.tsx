import { useMemo, useState } from 'react';
import { Alert } from './Alert';
import { ApiClientError, assignmentsApi } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';
import { SelectField } from './SelectField';
import type { Product, ProductAssignment, TicketParticipantLink } from '../types/domain';

type AssignmentPanelProps = {
  product: Product;
  ticketParticipants: TicketParticipantLink[];
  onChanged: () => Promise<void> | void;
};

type Mode = 'individual' | 'shared';

/**
 * Selector de asignación producto ↔ participante(s).
 */
export function AssignmentPanel({
  product,
  ticketParticipants,
  onChanged,
}: AssignmentPanelProps) {
  const { confirm } = useConfirm();
  const [mode, setMode] = useState<Mode>(
    (product.assignments?.length ?? 0) > 1 ? 'shared' : 'individual',
  );
  const [selectedOne, setSelectedOne] = useState('');
  const [selectedMany, setSelectedMany] = useState<string[]>([]);
  const [customRatios, setCustomRatios] = useState(false);
  const [ratios, setRatios] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignments = product.assignments ?? [];

  const available = useMemo(() => {
    const taken = new Set(assignments.map((a) => a.participantId));
    return ticketParticipants.filter((tp) => !taken.has(tp.participantId));
  }, [assignments, ticketParticipants]);

  function toggleMany(participantId: string) {
    setSelectedMany((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId],
    );
  }

  async function handleAssignIndividual() {
    if (!selectedOne) return;
    setSaving(true);
    setError(null);
    try {
      await assignmentsApi.assignOne({
        productId: product.id,
        participantId: selectedOne,
        shareRatio: 1,
      });
      setSelectedOne('');
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo asignar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignShared() {
    if (selectedMany.length < 2) {
      setError('Selecciona al menos 2 participantes para compartir.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const shareRatios = customRatios
        ? selectedMany.map((id) => {
            const n = Number(ratios[id] ?? '1');
            return n > 0 ? n : 1;
          })
        : undefined;
      await assignmentsApi.assignShared({
        productId: product.id,
        participantIds: selectedMany,
        shareRatios,
      });
      setSelectedMany([]);
      setRatios({});
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo asignar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(assignment: ProductAssignment) {
    const label = assignment.participant?.name || 'participante';
    const ok = await confirm({
      title: 'Quitar asignación',
      message: `¿Quitar a «${label}» de este producto?`,
      confirmLabel: 'Quitar',
      tone: 'danger',
    });
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await assignmentsApi.remove(assignment.id);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar.');
    } finally {
      setSaving(false);
    }
  }

  if (!ticketParticipants.length) {
    return (
      <p className="text-xs text-foreground-muted dark:text-slate-500">
        Añade participantes al ticket antes de asignar productos.
      </p>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-2xl border border-border bg-surface-muted/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Asignar
        </span>
        <div className="segmented text-xs">
          <button
            type="button"
            className={mode === 'individual' ? 'segmented-btn-active !py-1.5' : 'segmented-btn-inactive !py-1.5'}
            onClick={() => setMode('individual')}
          >
            Individual
          </button>
          <button
            type="button"
            className={mode === 'shared' ? 'segmented-btn-active !py-1.5' : 'segmented-btn-inactive !py-1.5'}
            onClick={() => setMode('shared')}
          >
            Compartido
          </button>
        </div>
      </div>

      {assignments.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 dark:bg-slate-900"
            >
              <span className="text-foreground dark:text-slate-200">
                {a.participant?.name || 'Sin nombre'}
                <span className="ml-2 text-xs text-foreground-muted">ratio {a.shareRatio}</span>
              </span>
              <button
                type="button"
                className="text-xs font-medium text-destructive hover:underline"
                disabled={saving}
                onClick={() => void handleRemove(a)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {mode === 'individual' && (
        <div className="form-row sm:grid-cols-[1fr_auto]">
          <SelectField
            value={selectedOne}
            disabled={saving || available.length === 0}
            placeholder={available.length ? 'Elegir participante…' : 'Todos ya asignados'}
            options={[
              { value: '', label: available.length ? 'Elegir participante…' : 'Todos ya asignados', disabled: true },
              ...available.map((tp) => ({
                value: tp.participantId,
                label: tp.participant.name || tp.participantId.slice(0, 8),
              })),
            ]}
            onChange={setSelectedOne}
          />
          <button
            type="button"
            className="btn-primary btn-sm form-row-action"
            disabled={!selectedOne || saving}
            onClick={() => void handleAssignIndividual()}
          >
            Asignar
          </button>
        </div>
      )}

      {mode === 'shared' && (
        <div className="space-y-2">
          <p className="text-xs text-foreground-muted dark:text-slate-500">
            Reemplaza las asignaciones actuales. Reparto equitativo por defecto.
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-border bg-surface p-3 dark:border-slate-700 dark:bg-slate-900">
            {ticketParticipants.map((tp) => {
              const checked = selectedMany.includes(tp.participantId);
              return (
                <label
                  key={tp.participantId}
                  className="flex items-center gap-2 rounded-lg py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-primary"
                    checked={checked}
                    onChange={() => toggleMany(tp.participantId)}
                    disabled={saving}
                  />
                  <span className="flex-1 text-foreground dark:text-slate-200">
                    {tp.participant.name || tp.participantId.slice(0, 8)}
                  </span>
                  {customRatios && checked && (
                    <input
                      className="input w-20 py-1 text-xs"
                      inputMode="decimal"
                      placeholder="1"
                      value={ratios[tp.participantId] ?? '1'}
                      onChange={(e) =>
                        setRatios((r) => ({
                          ...r,
                          [tp.participantId]: e.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              className="accent-primary"
              checked={customRatios}
              onChange={(e) => setCustomRatios(e.target.checked)}
            />
            Ratios personalizados
          </label>
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={selectedMany.length < 2 || saving}
            onClick={() => void handleAssignShared()}
          >
            {saving ? 'Guardando…' : 'Asignar compartido'}
          </button>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
