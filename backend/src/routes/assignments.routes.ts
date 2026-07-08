import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';

export const assignmentRouter = Router();

assignmentRouter.post('/', (req, res, next) =>
  assignmentController.assignOne(req, res, next),
);
assignmentRouter.post('/shared', (req, res, next) =>
  assignmentController.assignShared(req, res, next),
);
assignmentRouter.delete('/:id', (req, res, next) =>
  assignmentController.remove(req, res, next),
);
