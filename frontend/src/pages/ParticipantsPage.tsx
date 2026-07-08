import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import {
  ParticipantForm,
  type ParticipantFormValues,
} from '../components/ParticipantForm';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { ApiClientError, participantsApi } from '../services/api';
import type { Participant } from '../types/domain';
import { useConfirm } from '../context/ConfirmContext';
import { showSuccessToast } from '../utils/toast';
import { resolveMediaUrl } from '../utils/mediaUrl';

type ModalMode = 'create' | 'edit' | null;

export function ParticipantsPage() {
  const { confirm } = useConfirm();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async (q?: string) => {
    setStatus('loading');
    setError(null);
    try {
      const data = await participantsApi.list(q);
      setParticipants(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudieron cargar los participantes.',
      );
    }
  }, []);

  useEffect(() => {
    void load(debouncedQuery || undefined);
  }, [load, debouncedQuery]);

  const emptyMessage = useMemo(() => {
    if (debouncedQuery) {
      return {
        title: 'Sin resultados',
        description: `No hay participantes que coincidan con «${debouncedQuery}».`,
      };
    }
    return {
      title: 'Aún no hay participantes',
      description: 'Crea participantes con nombre y/o foto para asignarlos a tickets y grupos.',
    };
  }, [debouncedQuery]);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModal('create');
  }

  function openEdit(participant: Participant) {
    setEditing(participant);
    setFormError(null);
    setModal('edit');
  }

  function closeModal() {
    if (submitting) return;
    setModal(null);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: ParticipantFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name || null,
        photoUrl: values.photoUrl,
        photoFile: values.photoFile,
      };
      if (modal === 'edit' && editing) {
        await participantsApi.update(editing.id, payload);
        showSuccessToast('Participante actualizado.');
      } else {
        await participantsApi.create(payload);
        showSuccessToast('Participante creado.');
      }
      setModal(null);
      setEditing(null);
      await load(debouncedQuery || undefined);
    } catch (err) {
      setFormError(
        err instanceof ApiClientError ? err.message : 'Error al guardar el participante.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(participant: Participant) {
    const label = participant.name || 'este participante';
    const ok = await confirm({
      title: 'Eliminar participante',
      message: `¿Eliminar a «${label}»?`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await participantsApi.remove(participant.id);
      showSuccessToast('Participante eliminado.');
      await load(debouncedQuery || undefined);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo eliminar el participante.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participantes"
        subtitle="Comensales con nombre y/o foto. No son usuarios del sistema."
        actions={
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreate}>
            Nuevo participante
          </button>
        }
      />

      <div>
        <label className="label" htmlFor="participant-search">
          Buscar por nombre
        </label>
        <input
          id="participant-search"
          className="input max-w-md"
          value={query}
          placeholder="Escribe para filtrar…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {status === 'loading' && <Spinner label="Cargando participantes…" />}

      {status === 'error' && (
        <Alert tone="error">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void load(debouncedQuery || undefined)}
            >
              Reintentar
            </button>
          </div>
        </Alert>
      )}

      {status === 'ready' && participants.length === 0 && (
        <EmptyState
          title={emptyMessage.title}
          description={emptyMessage.description}
          actionLabel={debouncedQuery ? undefined : 'Crear participante'}
          onAction={debouncedQuery ? undefined : openCreate}
        />
      )}

      {status === 'ready' && participants.length > 0 && (
        <>
          <div className="card hidden overflow-hidden p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-neutral/80 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Participante</th>
                  <th className="px-4 py-3 font-medium">Foto</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {p.name || <span className="italic text-muted">Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.photoUrl ? (
                        <img
                          src={resolveMediaUrl(p.photoUrl)}
                          alt={p.name || 'Participante'}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(p.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-2 text-xs"
                          onClick={() => openEdit(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger px-3 py-2 text-xs"
                          onClick={() => void handleDelete(p)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {participants.map((p) => (
              <article key={p.id} className="card flex items-center gap-3">
                {p.photoUrl ? (
                  <img
                    src={resolveMediaUrl(p.photoUrl)}
                    alt={p.name || 'Participante'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-sm font-bold text-primary dark:bg-primary/20 dark:text-primary-light">
                    {(p.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium">
                    {p.name || <span className="italic text-muted">Sin nombre</span>}
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => openEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-danger px-3 py-1.5 text-xs"
                    onClick={() => void handleDelete(p)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modal !== null}
        title={modal === 'edit' ? 'Editar participante' : 'Nuevo participante'}
        onClose={closeModal}
      >
        <ParticipantForm
          initial={editing}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
