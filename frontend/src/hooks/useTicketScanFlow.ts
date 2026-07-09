import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError, ticketsApi } from '../services/api';
import { prepareTicketImageForUpload } from '../utils/compressTicketImage';

type ScanFileOptions = {
  /** Muestra vista previa local antes de procesar (pantalla /scan). */
  showPreview?: boolean;
};

export function useTicketScanFlow() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [failedTicketId, setFailedTicketId] = useState<string | null>(null);

  const scanFile = useCallback(
    async (file: File, options?: ScanFileOptions): Promise<boolean> => {
      const showPreview = options?.showPreview !== false;

      if (showPreview) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
      }

      setProcessing(true);
      setError(null);
      setErrorCode(null);
      setFailedTicketId(null);

      try {
        const prepared = await prepareTicketImageForUpload(file);
        const result = await ticketsApi.process(prepared);
        navigate(`/tickets/${result.ticket.id}/review`);
        return true;
      } catch (err) {
        if (err instanceof Error && err.message === 'EMPTY_IMAGE') {
          setError('No se pudo leer la foto. Intenta de nuevo o elige una imagen de la galería.');
          setErrorCode('VALIDATION_ERROR');
          return false;
        }

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
        return false;
      } finally {
        setProcessing(false);
      }
    },
    [navigate],
  );

  const clearPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const clearScanError = useCallback(() => {
    setError(null);
    setErrorCode(null);
    setFailedTicketId(null);
  }, []);

  return {
    previewUrl,
    processing,
    error,
    errorCode,
    failedTicketId,
    scanFile,
    clearPreview,
    clearScanError,
  };
}
