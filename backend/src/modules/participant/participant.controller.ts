import type { NextFunction, Request, Response } from 'express';
import { saveParticipantImage } from '../ticket/storage';
import { participantService } from './participant.service';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';

export class ParticipantController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search =
        typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const participants = await participantService.list(search || undefined);
      sendSuccess(res, participants, 'Participants retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const participant = await participantService.getById(req.params.id);
      sendSuccess(res, participant, 'Participant retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const participant = await participantService.create(req.body);
      sendSuccess(res, participant, 'Participant created', 201);
    } catch (err) {
      next(err);
    }
  }

  /** POST /participants/photo — sube imagen y devuelve photoUrl */
  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('image is required', 'VALIDATION_ERROR', 400);
      }
      const saved = await saveParticipantImage({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      });
      sendSuccess(res, { photoUrl: saved.publicUrl }, 'Photo uploaded', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const participant = await participantService.update(req.params.id, req.body);
      sendSuccess(res, participant, 'Participant updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await participantService.remove(req.params.id);
      sendSuccess(res, result, 'Participant deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const participantController = new ParticipantController();
