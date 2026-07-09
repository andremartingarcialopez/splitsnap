import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { AssignmentPanel } from '../components/AssignmentPanel';
import { EmptyState } from '../components/EmptyState';
import {
  ParticipantForm,
  type ParticipantFormValues,
} from '../components/ParticipantForm';
import { SelectField } from '../components/SelectField';
import { Spinner } from '../components/Spinner';
import { SummaryPanel } from '../components/SummaryPanel';
import { TipConfig } from '../components/TipConfig';
import {
  ApiClientError,
  groupsApi,
  participantsApi,
  productsApi,
  ticketsApi,
} from '../services/api';
import type { Group, Participant, Product, Ticket } from '../types/domain';
import { useConfirm } from '../context/ConfirmContext';
import { showSuccessToast } from '../utils/toast';
import { resolveMediaUrl } from '../utils/mediaUrl';

function money(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showNewParticipant, setShowNewParticipant] = useState(false);
  const [summaryRefresh, setSummaryRefresh] = useState(0);

  function bumpSummary() {
    setSummaryRefresh((n) => n + 1);
  }

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!id) return;
    const silent = options?.silent ?? false;
    if (!silent) {
      setStatus('loading');
      setError(null);
    }
    try {
      const [data, parts, groups] = await Promise.all([
        ticketsApi.get(id),
        participantsApi.list(),
        groupsApi.list(),
      ]);
      setTicket(data);
      setAllParticipants(parts);
      setAllGroups(groups);
      setStatus('ready');
    } catch (err) {
      if (silent) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el ticket.');
      } else {
        setStatus('error');
        setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el ticket.');
      }
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(String(product.unitPrice));
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!id || !editingId) return;
    const unitPrice = Number(editPrice);
    if (!editName.trim() || !(unitPrice > 0)) {
      setError('Nombre y precio > 0 son obligatorios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await productsApi.update(editingId, {
        name: editName.trim(),
        unitPrice,
      });
      setEditingId(null);
      showSuccessToast('Producto actualizado.');
      await load();
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function addProduct(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    const unitPrice = Number(newPrice);
    if (!newName.trim() || !(unitPrice > 0)) {
      setError('Nombre y precio > 0 son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      await ticketsApi.addProduct(id, { name: newName.trim(), unitPrice });
      setNewName('');
      setNewPrice('');
      showSuccessToast('Producto añadido.');
      await load();
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo añadir.');
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(productId: string) {
    if (!id) return;
    const ok = await confirm({
      title: 'Eliminar producto',
      message: '¿Eliminar este producto? También se borrarán sus asignaciones.',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await productsApi.remove(productId);
      showSuccessToast('Producto eliminado.');
      await load();
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar.');
    }
  }

  async function addParticipant() {
    if (!id || !selectedParticipantId) return;
    setSaving(true);
    try {
      const updated = await ticketsApi.addParticipant(id, {
        participantId: selectedParticipantId,
      });
      setTicket(updated);
      setSelectedParticipantId('');
      showSuccessToast('Participante añadido al ticket.');
      setStatus('ready');
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo añadir.');
    } finally {
      setSaving(false);
    }
  }

  async function createAndAddParticipant(values: ParticipantFormValues) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const created = await participantsApi.create({
        name: values.name || null,
        photoUrl: values.photoUrl,
        photoFile: values.photoFile,
      });
      const updated = await ticketsApi.addParticipant(id, {
        participantId: created.id,
      });
      setTicket(updated);
      setAllParticipants((prev) => [...prev, created]);
      setShowNewParticipant(false);
      showSuccessToast('Participante creado y añadido al ticket.');
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear.');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function removeParticipant(participantId: string, label: string) {
    if (!id) return;
    try {
      const preview = await ticketsApi.previewRemoveParticipant(id, participantId);
      let msg = `¿Quitar a «${label}» del ticket? También se eliminarán sus asignaciones.`;
      if (preview.orphanedProducts.length > 0) {
        const names = preview.orphanedProducts.map((p) => `«${p.name}»`).join(', ');
        msg += `\n\nEstos productos quedarán sin asignar: ${names}. No podrás finalizar hasta reasignarlos.`;
      }
      const ok = await confirm({
        title: 'Quitar participante',
        message: msg,
        confirmLabel: 'Quitar',
        tone: 'danger',
      });
      if (!ok) return;

      const result = await ticketsApi.removeParticipant(id, participantId);
      setTicket(result.ticket);
      if (result.orphanedProducts.length > 0) {
        showSuccessToast(
          `Participante removido. Productos huérfanos: ${result.orphanedProducts.map((p) => p.name).join(', ')}.`,
        );
      } else {
        showSuccessToast('Participante removido.');
      }
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo remover.');
    }
  }

  async function linkGroup() {
    if (!id || !selectedGroupId) return;
    setSaving(true);
    try {
      const updated = await ticketsApi.linkGroup(id, selectedGroupId);
      setTicket(updated);
      setSelectedGroupId('');
      showSuccessToast('Grupo vinculado; participantes importados.');
      bumpSummary();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo vincular el grupo.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTicket() {
    if (!id || !ticket) return;
    const label = ticket.restaurantName || ticket.title;
    const ok = await confirm({
      title: 'Eliminar ticket',
      message: `¿Eliminar el ticket «${label}» por completo?`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await ticketsApi.remove(id);
      navigate('/tickets');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar.');
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <Spinner label="Cargando ticket…" />
      </div>
    );
  }

  if (status === 'error' || !ticket) {
    return (
      <div className="space-y-4">
        <Alert tone="error">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error || 'Ticket no encontrado'}</span>
            <button type="button" className="btn-secondary" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  const products = ticket.products ?? [];
  const onTicket = new Set((ticket.participants ?? []).map((p) => p.participantId));
  const availableParticipants = allParticipants.filter((p) => !onTicket.has(p.id));
  const isFinalized = Boolean(ticket.finalizedAt);

  if (isFinalized) {
    return (
      <div className="space-y-6">
        <Alert tone="info">
          Este ticket está finalizado.{' '}
          <Link to={`/history/${ticket.id}`} className="underline">
            Ver en historial (solo lectura)
          </Link>
        </Alert>
        {id && (
          <SummaryPanel ticketId={id} refreshKey={summaryRefresh} isFinalized />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="badge-info text-xs uppercase tracking-wide">{ticket.processingStatus}</p>
          <h1 className="page-title mt-1">
            {ticket.restaurantName || ticket.title}
          </h1>
          <p className="page-subtitle">
            {new Date(ticket.createdAt).toLocaleString('es-MX')} · propina {ticket.tipMode}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/tickets" className="btn-secondary text-center">
            Listado
          </Link>
          <button type="button" className="btn-danger" onClick={() => void deleteTicket()}>
            Eliminar ticket
          </button>
        </div>
      </div>

      {ticket.processingStatus === 'FAILED' && (
        <Alert tone="error">
          El pipeline falló
          {ticket.failureReason ? `: ${ticket.failureReason}` : '.'} Puedes editar o
          añadir productos y participantes manualmente.
        </Alert>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="card overflow-hidden p-0">
          {ticket.ticketImageUrl.startsWith('/uploads') ? (
            <img
              src={resolveMediaUrl(ticket.ticketImageUrl)}
              alt="Ticket"
              className="h-full max-h-72 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-40 items-center justify-center bg-surface-muted text-sm text-foreground-muted dark:bg-slate-800 dark:text-slate-500">
              Sin imagen
            </div>
          )}
        </div>

        <div className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <div className="stat-card">
            <p className="stat-label">Subtotal</p>
            <p className="stat-value">{money(ticket.subtotal)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">IVA</p>
            <p className="stat-value">{money(ticket.tax)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Descuento</p>
            <p className="stat-value">{money(ticket.discount)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total</p>
            <p className="stat-value text-primary dark:text-primary-light">{money(ticket.total)}</p>
          </div>
        </div>
      </div>

      {/* Participantes del ticket */}
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-foreground dark:text-white">Participantes del ticket</h2>
        {(ticket.participants ?? []).length === 0 ? (
          <p className="text-sm text-foreground-muted dark:text-slate-400">Nadie asignado todavía.</p>
        ) : (
          <ul className="divide-y divide-border dark:divide-slate-800">
            {(ticket.participants ?? []).map((tp) => (
              <li
                key={tp.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {tp.participant.name || (
                    <span className="italic text-muted">Sin nombre</span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn-danger px-3 py-1.5 text-xs"
                  onClick={() =>
                    void removeParticipant(
                      tp.participantId,
                      tp.participant.name || 'participante',
                    )
                  }
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="form-row sm:grid-cols-[1fr_auto_auto]">
          <SelectField
            value={selectedParticipantId}
            placeholder="Seleccionar participante…"
            options={[
              { value: '', label: 'Seleccionar participante…', disabled: true },
              ...availableParticipants.map((p) => ({
                value: p.id,
                label: p.name || p.id.slice(0, 8),
              })),
            ]}
            onChange={setSelectedParticipantId}
          />
          <button
            type="button"
            className="btn-primary form-row-action"
            disabled={!selectedParticipantId || saving}
            onClick={() => void addParticipant()}
          >
            Añadir
          </button>
          <button
            type="button"
            className="btn-secondary form-row-action"
            disabled={saving}
            onClick={() => setShowNewParticipant(true)}
          >
            Crear nuevo
          </button>
        </div>

        {showNewParticipant && (
          <div className="rounded-2xl border border-border bg-surface-muted/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="mb-3 text-sm font-semibold text-foreground dark:text-white">Nuevo participante</h3>
            <ParticipantForm
              submitting={saving}
              error={error}
              onCancel={() => setShowNewParticipant(false)}
              onSubmit={createAndAddParticipant}
            />
          </div>
        )}

        <div className="form-row border-t border-border pt-4 dark:border-slate-800 sm:grid-cols-[1fr_auto]">
          <SelectField
            value={selectedGroupId}
            placeholder="Importar desde grupo…"
            options={[
              { value: '', label: 'Importar desde grupo…', disabled: true },
              ...allGroups.map((g) => ({ value: g.id, label: g.name })),
            ]}
            onChange={setSelectedGroupId}
          />
          <button
            type="button"
            className="btn-secondary form-row-action"
            disabled={!selectedGroupId || saving}
            onClick={() => void linkGroup()}
          >
            Vincular grupo
          </button>
        </div>

        {(ticket.groups ?? []).length > 0 && (
          <p className="text-xs text-muted">
            Grupos vinculados:{' '}
            {(ticket.groups ?? []).map((g) => g.group.name).join(', ')}
          </p>
        )}
      </section>

      <TipConfig
        ticket={ticket}
        saving={saving}
        onUpdateGlobal={async (input) => {
          if (!id) return;
          setSaving(true);
          try {
            const updated = await ticketsApi.updateTip(id, input);
            setTicket(updated);
            showSuccessToast('Propina actualizada.');
            bumpSummary();
          } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar.');
          } finally {
            setSaving(false);
          }
        }}
        onUpdateParticipant={async (participantId, pct) => {
          if (!id) return;
          setSaving(true);
          try {
            const updated = await ticketsApi.updateParticipantTip(id, participantId, pct);
            setTicket(updated);
            showSuccessToast('Propina individual actualizada.');
            bumpSummary();
          } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar.');
          } finally {
            setSaving(false);
          }
        }}
      />

      {/* Productos */}
      {products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="Añade productos manualmente para continuar con la división."
        />
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <article key={p.id} className="card space-y-3">
              {editingId === p.id ? (
                <form
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  onSubmit={saveEdit}
                >
                  <input
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    className="input sm:max-w-[140px]"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={saving}>
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">{p.name}</h3>
                    <p className="text-sm text-foreground-muted dark:text-slate-400">
                      {money(p.unitPrice)} ·{' '}
                      {p.detectedByAI
                        ? `IA${p.confidenceScore != null ? ` ${p.confidenceScore}%` : ''}`
                        : 'Manual'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={() => startEdit(p)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-danger px-3 py-2 text-xs"
                      onClick={() => void removeProduct(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              <AssignmentPanel
                product={p}
                ticketParticipants={ticket.participants ?? []}
                onChanged={() => {
                  // Recarga sin spinner: evita saltar al inicio en móvil al asignar
                  void load({ silent: true });
                  bumpSummary();
                }}
              />
            </article>
          ))}
        </div>
      )}

      <form className="card space-y-3" onSubmit={addProduct}>
        <h2 className="text-lg font-semibold text-foreground dark:text-white">Añadir producto</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <input
            className="input"
            placeholder="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Precio"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            Añadir
          </button>
        </div>
      </form>

      {id && (
        <SummaryPanel
          ticketId={id}
          refreshKey={summaryRefresh}
          isFinalized={Boolean(ticket.finalizedAt)}
        />
      )}
    </div>
  );
}
