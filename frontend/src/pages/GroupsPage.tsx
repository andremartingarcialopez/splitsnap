import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { GroupForm, type GroupFormValues } from '../components/GroupForm';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import type { ParticipantFormValues } from '../components/ParticipantForm';
import { ApiClientError, groupsApi, participantsApi } from '../services/api';
import type { Group, Participant } from '../types/domain';
import { useConfirm } from '../context/ConfirmContext';
import { showSuccessToast } from '../utils/toast';

type ModalMode = 'create' | 'edit' | null;

export function GroupsPage() {
  const { confirm } = useConfirm();
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Group | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creatingParticipant, setCreatingParticipant] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await groupsApi.list();
      setGroups(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los grupos.');
    }
  }, []);

  const loadParticipants = useCallback(async () => {
    try {
      const data = await participantsApi.list();
      setParticipants(data);
    } catch {
      // La lista de participantes es auxiliar; el formulario sigue usable.
    }
  }, []);

  useEffect(() => {
    void load();
    void loadParticipants();
  }, [load, loadParticipants]);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModal('create');
    void loadParticipants();
  }

  async function openEdit(group: Group) {
    setFormError(null);
    setModal('edit');
    setLoadingEdit(true);
    setEditing(null);
    void loadParticipants();
    try {
      const detail = await groupsApi.get(group.id);
      setEditing(detail);
    } catch (err) {
      setModal(null);
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el grupo.');
    } finally {
      setLoadingEdit(false);
    }
  }

  function closeModal() {
    if (submitting || creatingParticipant) return;
    setModal(null);
    setEditing(null);
    setFormError(null);
  }

  async function handleCreateParticipant(values: ParticipantFormValues): Promise<Participant> {
    setCreatingParticipant(true);
    try {
      const created = await participantsApi.create({
        name: values.name.trim() || null,
        photoUrl: values.photoUrl,
        photoFile: values.photoFile,
      });
      setParticipants((prev) => [created, ...prev]);
      return created;
    } finally {
      setCreatingParticipant(false);
    }
  }

  async function handleSubmit(values: GroupFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (modal === 'edit' && editing) {
        await groupsApi.update(editing.id, {
          name: values.name,
          description: values.description || null,
          participantIds: values.participantIds,
        });
        showSuccessToast('Grupo actualizado.');
      } else {
        await groupsApi.create({
          name: values.name,
          description: values.description || null,
          participantIds: values.participantIds,
        });
        showSuccessToast('Grupo creado.');
      }
      setModal(null);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Error al guardar el grupo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(group: Group) {
    const ok = await confirm({
      title: 'Eliminar grupo',
      message: `¿Eliminar el grupo «${group.name}»? Esta acción no se puede deshacer.`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await groupsApi.remove(group.id);
      showSuccessToast('Grupo eliminado.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el grupo.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis grupos"
        subtitle="Conjuntos reutilizables de participantes para tus tickets."
        actions={
          status === 'ready' && groups.length > 0 ? (
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreate}>
              Nuevo grupo
            </button>
          ) : undefined
        }
      />

      {status === 'loading' && <Spinner label="Cargando grupos…" />}

      {status === 'error' && (
        <Alert tone="error">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" className="btn-secondary" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        </Alert>
      )}

      {status === 'ready' && groups.length === 0 && (
        <EmptyState
          title="Aún no hay grupos"
          description="Crea tu primer grupo para reutilizar participantes en futuros tickets."
          actionLabel="Crear grupo"
          onAction={openCreate}
        />
      )}

      {status === 'ready' && groups.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden !p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/80 text-foreground-muted dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium">Participantes</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{group.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {group.description || <span className="italic">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {group.participantCount ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(group.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-2 text-xs"
                          onClick={() => void openEdit(group)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger px-3 py-2 text-xs"
                          onClick={() => void handleDelete(group)}
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

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {groups.map((group) => (
              <article key={group.id} className="card space-y-3">
                <div>
                  <h2 className="text-base font-medium">{group.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {group.description || 'Sin descripción'}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {group.participantCount ?? 0} participante
                    {(group.participantCount ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary flex-1 py-2 text-xs"
                    onClick={() => void openEdit(group)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-danger flex-1 py-2 text-xs"
                    onClick={() => void handleDelete(group)}
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
        title={modal === 'edit' ? 'Editar grupo' : 'Nuevo grupo'}
        onClose={closeModal}
      >
        {modal === 'edit' && loadingEdit ? (
          <Spinner label="Cargando participantes del grupo…" />
        ) : (
          <GroupForm
            initial={editing}
            participants={participants}
            submitting={submitting}
            creatingParticipant={creatingParticipant}
            error={formError}
            onCreateParticipant={handleCreateParticipant}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}
