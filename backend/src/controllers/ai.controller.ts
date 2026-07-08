import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { aiService } from '../modules/ai/ai.service';
import { sendSuccess } from '../utils/response';

const bodySchema = z.object({
  text: z.string().trim().min(1, 'text is required'),
});

export class AiController {
  async parseTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text } = bodySchema.parse(req.body);
      const parsed = await aiService.parseTicket(text);
      sendSuccess(res, parsed, 'Ticket parsed');
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
