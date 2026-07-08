import { Router } from 'express';
import { historyController } from '../controllers/history.controller';

export const historyRouter = Router();

historyRouter.get('/', (req, res, next) => historyController.list(req, res, next));
historyRouter.get('/:id', (req, res, next) => historyController.getById(req, res, next));
