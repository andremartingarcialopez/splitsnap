import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import { ScanProcessingOverlay } from '../components/ScanProcessingOverlay';
import { ApiClientError, ticketsApi } from '../services/api';

type ManualLine = { name: string; unitPrice: string };

export function NewTicketPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [failedTicketId, setFailedTicketId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [lines, setLines] = useState<ManualLine[]>([{ name: '', unitPrice: '' }]);
  const [manualSaving, setManualSaving] = useState(false);

  function onFileChange(next: File | null) {
    if (!next) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(next));
    setError(null);
    setErrorCode(null);
    setFailedTicketId(null);
    void processFile(next);
  }

  async function processFile(file: File) {
    setProcessing(true);
    setError(null);
    setErrorCode(null);
    try {
      const result = await ticketsApi.process(file);
      navigate(`/tickets/${result.ticket.id}/review`);
    } catch (err) {
      const apiErr = err instanceof ApiClientError ? err : null;
      setError(
        apiErr?.message ||
          'No se pudo procesar el ticket. Puedes ingresar los productos manualmente.',
      );
      setErrorCode(apiErr?.code ?? 'OCR_ERROR');
      const details = apiErr?.details as
        | { ticketId?: string; allowManualEntry?: boolean }
        | undefined;
      if (details?.ticketId) setFailedTicketId(details.ticketId);
      setShowManual(true);
    } finally {
      setProcessing(false);
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const products = lines
      .map((l) => ({
        name: l.name.trim(),
        unitPrice: Number(l.unitPrice),
      }))
      .filter((p) => p.name && p.unitPrice > 0);

    if (!products.length) {
      setError('Agrega al menos un producto con nombre y precio > 0.');
      return;
    }

    setManualSaving(true);
    setError(null);
    try {
      const ticket = await ticketsApi.createManual({
        restaurantName: restaurantName.trim() || null,
        products,
      });
      navigate(`/tickets/${ticket.id}/review`);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudo guardar el ticket manual.',
      );
    } finally {
      setManualSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ScanProcessingOverlay active={processing} />

      <PageHeader
        title="Escanear ticket"
        subtitle="Toma una foto o elige una imagen. El procesamiento comienza automáticamente."
      />

      <div className="card space-y-5">
        <input
          ref={fileInputRef}
          id="ticket-image"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          capture="environment"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          disabled={processing}
        />

        {!previewUrl ? (
          <button
            type="button"
            className="upload-zone w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted dark:bg-primary/20">
              <svg
                className="h-7 w-7 text-primary dark:text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="font-semibold text-foreground dark:text-white">
              Toca para tomar foto o subir imagen
            </p>
            <p className="mt-1 text-sm text-foreground-muted dark:text-slate-400">
              JPG o PNG · máximo 5 MB
            </p>
          </button>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-muted dark:border-slate-800 dark:bg-slate-800/50">
            <img
              src={previewUrl}
              alt="Vista previa del ticket"
              className="mx-auto max-h-80 w-full object-contain"
            />
            <div className="border-t border-border p-3 text-center dark:border-slate-800">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => setShowManual(true)}
          disabled={processing}
        >
          Ingreso manual
        </button>
      </div>

      {error && (
        <Alert tone="error">
          <div className="space-y-1">
            <p>{error}</p>
            {errorCode && (
              <p className="text-xs opacity-80">
                Código: {errorCode}
                {failedTicketId ? ` · ticket ${failedTicketId}` : ''}
              </p>
            )}
            <p className="text-xs">
              Puedes reintentar con otra foto o completar el ticket manualmente abajo.
            </p>
          </div>
        </Alert>
      )}

      {showManual && (
        <form className="card space-y-4" onSubmit={handleManualSubmit}>
          <div>
            <h2 className="text-lg font-semibold text-foreground dark:text-white">
              Ingreso manual de productos
            </h2>
            <p className="text-sm text-foreground-muted dark:text-slate-400">
              Fallback cuando OCR/IA fallan.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="manual-restaurant">
              Restaurante
            </label>
            <input
              id="manual-restaurant"
              className="input"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                <input
                  className="input"
                  placeholder="Producto"
                  value={line.name}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setLines(next);
                  }}
                />
                <input
                  className="input"
                  placeholder="Precio"
                  inputMode="decimal"
                  value={line.unitPrice}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], unitPrice: e.target.value };
                    setLines(next);
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  disabled={lines.length === 1}
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setLines([...lines, { name: '', unitPrice: '' }])}
            >
              Añadir producto
            </button>
            <button type="submit" className="btn-primary" disabled={manualSaving}>
              {manualSaving ? 'Guardando…' : 'Continuar a revisión'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
