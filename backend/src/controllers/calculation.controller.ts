import type { NextFunction, Request, Response } from 'express';
import { calculationService } from '../modules/calculation/calculation.service';
import { sendSuccess } from '../utils/response';

export class CalculationController {
  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await calculationService.summarize(req.params.ticketId);
      sendSuccess(res, data, 'Summary calculated');
    } catch (err) {
      next(err);
    }
  }

  async calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await calculationService.summarize(req.params.ticketId);
      sendSuccess(res, data, 'Recalculation complete');
    } catch (err) {
      next(err);
    }
  }
}

export const calculationController = new CalculationController();
