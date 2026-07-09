/** Mensajes amigables para errores del pipeline de escaneo (OCR / IA). */
const BY_CODE: Record<string, string> = {
  AI_PARSE_ERROR:
    'No se detectó la información del ticket correctamente. Usa una foto clara del recibo o ingresa los datos manualmente.',
  OCR_ERROR:
    'No se pudo leer el texto del ticket. Intenta con mejor luz y enfoque, o usa ingreso manual.',
  VALIDATION_ERROR:
    'La imagen no es válida. Debe ser JPG o PNG y no superar 5 MB.',
  EXTERNAL_SERVICE_UNAVAILABLE:
    'El servicio de procesamiento no está disponible. Intenta más tarde o usa ingreso manual.',
  NETWORK_ERROR:
    'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
};

const DEFAULT_MESSAGE =
  'No se pudo procesar el ticket. Puedes ingresar los productos manualmente.';

export function getScanErrorMessage(code?: string | null): string {
  if (code && BY_CODE[code]) return BY_CODE[code];
  return DEFAULT_MESSAGE;
}
