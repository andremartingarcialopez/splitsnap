import type { NextFunction, Request, Response } from 'express';
import { historyService } from '../modules/history/history.service';
import { sendSuccess } from '../utils/response';

export class HistoryController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await historyService.list();
      sendSuccess(res, items, 'History retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const detail = await historyService.getById(req.params.id);
      sendSuccess(res, detail, 'Historical ticket retrieved');
    } catch (err) {
      next(err);
    }
  }
}

export const historyController = new HistoryController();
