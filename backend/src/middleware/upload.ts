import multer from 'multer';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);
    if (!ok) {
      cb(new AppError('Only JPG/JPEG/PNG allowed', 'VALIDATION_ERROR', 400));
      return;
    }
    cb(null, true);
  },
});

/** Campo multipart `image` — JPG/PNG ≤ MAX_UPLOAD_MB */
export const uploadImage: RequestHandler = (req, res, next) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    if (err) {
      next(
        new AppError(
          err instanceof Error ? err.message : 'Upload failed',
          'VALIDATION_ERROR',
          400,
        ),
      );
      return;
    }
    next();
  });
};

/** Alias usado por rutas de tickets (Blueprint §4.1) */
export const uploadTicketImage = uploadImage;
export const uploadParticipantImage = uploadImage;
