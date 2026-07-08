import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export function assertAllowedImage(mimeType: string, size: number): void {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AppError(
      'Only JPG/JPEG/PNG images are allowed',
      'VALIDATION_ERROR',
      400,
    );
  }
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (size > maxBytes) {
    throw new AppError(
      `Image exceeds max size of ${env.MAX_UPLOAD_MB} MB`,
      'VALIDATION_ERROR',
      400,
    );
  }
}

export async function saveTicketImage(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}): Promise<{ absolutePath: string; publicUrl: string; filename: string }> {
  return saveUploadedImage({ ...input, folder: 'tickets' });
}

/** Guarda foto de participante en /uploads/participants/ */
export async function saveParticipantImage(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}): Promise<{ absolutePath: string; publicUrl: string; filename: string }> {
  return saveUploadedImage({ ...input, folder: 'participants' });
}

async function saveUploadedImage(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  folder: 'tickets' | 'participants';
}): Promise<{ absolutePath: string; publicUrl: string; filename: string }> {
  assertAllowedImage(input.mimeType, input.buffer.byteLength);

  const ext =
    input.mimeType === 'image/png'
      ? '.png'
      : path.extname(input.originalName).toLowerCase() || '.jpg';

  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(env.storageDir, input.folder);
  await fs.mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, filename);
  await fs.writeFile(absolutePath, input.buffer);

  const publicUrl = `/uploads/${input.folder}/${filename}`;
  return { absolutePath, publicUrl, filename };
}
