import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { AppIcon } from '../components/AppIcon';
import { PageHeader } from '../components/PageHeader';
import { ScanProcessingOverlay } from '../components/ScanProcessingOverlay';
import { TicketImageSourcePicker } from '../components/TicketImageSourcePicker';
import { useTicketScanFlow } from '../hooks/useTicketScanFlow';
import { ApiClientError, ticketsApi } from '../services/api';
import { faImage } from '../icons';

type ManualLine = { name: string; unitPrice: string };

export function NewTicketPage() {
  const navigate = useNavigate();
  const { previewUrl, processing, error, errorCode, failedTicketId, scanFile } =
    useTicketScanFlow();
  const [showManual, setShowManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [lines, setLines] = useState<ManualLine[]>([{ name: '', unitPrice: '' }]);
  const [manualSaving, setManualSaving] = useState(false);

  async function handleFileSelected(file: File) {
    const ok = await scanFile(file);
    if (!ok) setShowManual(true);
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
      setManualError('Agrega al menos un producto con nombre y precio > 0.');
      return;
    }

    setManualSaving(true);
    setManualError(null);
    try {
      const ticket = await ticketsApi.createManual({
        restaurantName: restaurantName.trim() || null,
        products,
      });
      navigate(`/tickets/${ticket.id}/review`);
    } catch (err) {
      setManualError(
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
        subtitle="Elige cámara o galería. El procesamiento comienza automáticamente."
      />

      <div className="card space-y-5">
        {!previewUrl ? (
          <div className="upload-zone w-full cursor-default">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted dark:bg-primary/20">
              <AppIcon icon={faImage} size="lg" className="text-primary dark:text-primary-light" />
            </div>
            <p className="font-semibold text-foreground dark:text-white">
              Escanea tu ticket
            </p>
            <p className="mt-1 text-sm text-foreground-muted dark:text-slate-400">
              JPG o PNG · máximo 5 MB
            </p>
            <div className="mt-4">
              <TicketImageSourcePicker
                onFileSelected={(file) => void handleFileSelected(file)}
                disabled={processing}
              />
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-muted dark:border-slate-800 dark:bg-slate-800/50">
            <img
              src={previewUrl}
              alt="Vista previa del ticket"
              className="mx-auto max-h-80 w-full object-contain"
            />
            <div className="space-y-3 border-t border-border p-3 dark:border-slate-800">
              <p className="text-center text-sm text-foreground-muted dark:text-slate-400">
                Cambiar imagen
              </p>
              <TicketImageSourcePicker
                onFileSelected={(file) => void handleFileSelected(file)}
                disabled={processing}
                variant="row"
              />
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
          {manualError && <Alert tone="error">{manualError}</Alert>}
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
