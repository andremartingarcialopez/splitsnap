import type { NextFunction, Request, Response } from 'express';
import { healthService } from '../modules/health/health.service';
import { sendSuccess } from '../utils/response';

export class HealthController {
  async get(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await healthService.check();
      const httpStatus = report.status === 'unhealthy' ? 503 : 200;
      sendSuccess(res, report, 'Health check', httpStatus);
    } catch (err) {
      next(err);
    }
  }
}

export const healthController = new HealthController();
