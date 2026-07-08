import { Router } from 'express';
import { groupController } from '../modules/group/group.controller';
import { validateBody } from '../middleware/validate';
import {
  createGroupSchema,
  updateGroupSchema,
} from '../validators/group.validator';

export const groupRouter = Router();

groupRouter.get('/', (req, res, next) => groupController.list(req, res, next));
groupRouter.post('/', validateBody(createGroupSchema), (req, res, next) =>
  groupController.create(req, res, next),
);
groupRouter.get('/:id', (req, res, next) => groupController.getById(req, res, next));
groupRouter.put('/:id', validateBody(updateGroupSchema), (req, res, next) =>
  groupController.update(req, res, next),
);
groupRouter.delete('/:id', (req, res, next) => groupController.remove(req, res, next));
