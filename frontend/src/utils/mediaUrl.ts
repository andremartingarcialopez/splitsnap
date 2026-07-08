/** Origen público del API (sin /api/v1). En Railway suele venir de VITE_API_BASE_URL. */
function apiOrigin(): string {
  const explicit = import.meta.env.VITE_API_ORIGIN as string | undefined;
  if (explicit?.trim()) return explicit.trim().replace(/\/$/, '');

  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (base?.startsWith('http')) {
    return base.replace(/\/api\/v1\/?$/, '');
  }
  return '';
}

/** Convierte rutas /uploads/... en URL absoluta cuando el API está en otro dominio. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) {
    const origin = apiOrigin();
    return origin ? `${origin}${url}` : url;
  }
  return url;
}
