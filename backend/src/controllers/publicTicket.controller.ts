import type { NextFunction, Request, Response } from 'express';
import { collaborationService } from '../modules/collaboration/collaboration.service';
import { sendSuccess } from '../utils/response';

export class PublicTicketController {
  async getByShareCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shareCode = String(req.params.shareCode ?? '').toUpperCase();
      const data = await collaborationService.getPublicByShareCode(shareCode);
      sendSuccess(res, data, 'Public ticket');
    } catch (err) {
      next(err);
    }
  }
}

export const publicTicketController = new PublicTicketController();
