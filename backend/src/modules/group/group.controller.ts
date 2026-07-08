import type { NextFunction, Request, Response } from 'express';
import { groupService } from './group.service';
import { sendSuccess } from '../../utils/response';

export class GroupController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = await groupService.list();
      sendSuccess(res, groups, 'Groups retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.create(req.body);
      sendSuccess(res, group, 'Group created', 201);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.getById(req.params.id);
      sendSuccess(res, group, 'Group retrieved');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.update(req.params.id, req.body);
      sendSuccess(res, group, 'Group updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await groupService.remove(req.params.id);
      sendSuccess(res, result, 'Group deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const groupController = new GroupController();
