const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESS_BELOW_BYTES = 450_000;

function inferMimeType(file: File): string {
  if (file.type.startsWith('image/')) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

function withMimeType(file: File): File {
  const mime = inferMimeType(file);
  if (file.type === mime) return file;
  const name =
    file.name && file.name.includes('.') ? file.name : mime === 'image/png' ? 'ticket.png' : 'ticket.jpg';
  return new File([file], name, { type: mime, lastModified: file.lastModified || Date.now() });
}

async function drawToJpeg(file: File): Promise<File | null> {
  const normalized = withMimeType(file);

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(normalized);
      try {
        return await canvasToJpeg(bitmap, bitmap.width, bitmap.height, normalized.name);
      } finally {
        bitmap.close();
      }
    }
  } catch {
    /* fallback abajo */
  }

  try {
    return await loadViaImageElement(normalized);
  } catch {
    return null;
  }
}

async function loadViaImageElement(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image load failed'));
      el.src = url;
    });
    return canvasToJpeg(img, img.naturalWidth, img.naturalHeight, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  originalName: string,
): Promise<File> {
  const longest = Math.max(width, height);
  const scale = longest > MAX_DIMENSION_PX ? MAX_DIMENSION_PX / longest : 1;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(source, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
  });
  if (!blob || blob.size === 0) throw new Error('Empty JPEG blob');

  const baseName = originalName.replace(/\.[^.]+$/, '') || 'ticket';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/**
 * Normaliza MIME (cámara móvil suele enviar type vacío) y comprime si hace falta.
 */
export async function compressTicketImage(file: File): Promise<File> {
  if (file.size === 0) {
    throw new Error('EMPTY_IMAGE');
  }

  const normalized = withMimeType(file);
  if (normalized.size <= SKIP_COMPRESS_BELOW_BYTES) {
    return normalized;
  }

  const compressed = await drawToJpeg(normalized);
  if (!compressed || compressed.size === 0) {
    return normalized;
  }
  if (compressed.size >= normalized.size) {
    return normalized;
  }
  return compressed;
}

export async function prepareTicketImageForUpload(file: File): Promise<File> {
  const prepared = await compressTicketImage(file);
  if (prepared.size === 0) {
    throw new Error('EMPTY_IMAGE');
  }
  return withMimeType(prepared);
}
