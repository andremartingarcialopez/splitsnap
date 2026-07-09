import type { NextFunction, Request, Response } from 'express';
import { healthService } from '../modules/health/health.service';
import { sendSuccess } from '../utils/response';

export class HealthController {
  /** Liveness probe — Railway/containers: solo confirma que el proceso HTTP responde. */
  live(_req: Request, res: Response): void {
    sendSuccess(
      res,
      {
        status: 'alive',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      'Liveness check',
      200,
    );
  }

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
