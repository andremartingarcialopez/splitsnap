const KEY_PATTERNS = [
  /apikey=[^&\s]+/gi,
  /key=[^&\s]+/gi,
  /\b[A-Za-z0-9_-]{20,}\b/g,
];

export type AdapterErrorMeta = {
  adapter: 'ocr' | 'gemini' | string;
  operation?: string;
  statusCode?: number;
  code?: string;
};

/** Redacta posibles API keys antes de escribir en logs. */
export function redactSecrets(message: string): string {
  let out = message;
  for (const pattern of KEY_PATTERNS) {
    out = out.replace(pattern, '[REDACTED]');
  }
  return out;
}

/**
 * Logging seguro para fallos de adapters externos (MDD §7.4).
 * Nunca imprime API keys ni cuerpos completos de respuesta.
 */
export function logAdapterError(err: unknown, meta: AdapterErrorMeta): void {
  const base = {
    adapter: meta.adapter,
    operation: meta.operation,
    statusCode: meta.statusCode,
    code: meta.code,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof Error) {
    console.error('[adapter-error]', {
      ...base,
      name: err.name,
      message: redactSecrets(err.message),
    });
    return;
  }

  console.error('[adapter-error]', {
    ...base,
    message: redactSecrets(String(err)),
  });
}
