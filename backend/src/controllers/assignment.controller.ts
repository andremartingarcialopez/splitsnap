import type { NextFunction, Request, Response } from 'express';
import { assignmentService } from '../modules/assignment/assignment.service';
import {
  assignOneSchema,
  assignSharedSchema,
} from '../validators/assignment.validator';
import { sendSuccess } from '../utils/response';

export class AssignmentController {
  async listByTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await assignmentService.listByTicket(req.params.ticketId);
      sendSuccess(res, data, 'Assignments retrieved');
    } catch (err) {
      next(err);
    }
  }

  async assignOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = assignOneSchema.parse(req.body);
      const data = await assignmentService.assignOne(body);
      sendSuccess(res, data, 'Assignment created', 201);
    } catch (err) {
      next(err);
    }
  }

  async assignShared(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = assignSharedSchema.parse(req.body);
      const data = await assignmentService.assignShared(body);
      sendSuccess(res, data, 'Shared assignment created', 201);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await assignmentService.remove(req.params.id);
      sendSuccess(res, result, 'Assignment deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const assignmentController = new AssignmentController();
