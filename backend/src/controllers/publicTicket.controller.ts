import type { NextFunction, Request, Response } from 'express';
import { collaborationService } from '../modules/collaboration/collaboration.service';
import {
  publicJoinSchema,
  publicToggleProductSchema,
} from '../validators/collaboration.validator';
import { sendSuccess } from '../utils/response';

function normalizeShareCode(req: Request): string {
  return String(req.params.shareCode ?? '').toUpperCase();
}

export class PublicTicketController {
  async getByShareCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await collaborationService.getPublicByShareCode(normalizeShareCode(req));
      sendSuccess(res, data, 'Public ticket');
    } catch (err) {
      next(err);
    }
  }

  async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = publicJoinSchema.parse(req.body ?? {});
      const data = await collaborationService.joinSession(normalizeShareCode(req), body);
      sendSuccess(res, data, 'Joined session', 201);
    } catch (err) {
      next(err);
    }
  }

  async getParticipantSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await collaborationService.getParticipantSession(
        normalizeShareCode(req),
        req.params.ticketParticipantId,
      );
      sendSuccess(res, data, 'Participant session');
    } catch (err) {
      next(err);
    }
  }

  async toggleProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = publicToggleProductSchema.parse(req.body ?? {});
      const data = await collaborationService.toggleProductSelection(
        normalizeShareCode(req),
        req.params.ticketParticipantId,
        body.productId,
      );
      sendSuccess(res, data, 'Product toggled');
    } catch (err) {
      next(err);
    }
  }

  async submitSelection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await collaborationService.submitSelection(
        normalizeShareCode(req),
        req.params.ticketParticipantId,
      );
      sendSuccess(res, data, 'Selection submitted');
    } catch (err) {
      next(err);
    }
  }
}

export const publicTicketController = new PublicTicketController();
