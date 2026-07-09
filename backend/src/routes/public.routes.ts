import { Router } from 'express';
import { publicTicketController } from '../controllers/publicTicket.controller';

export const publicRouter = Router();

publicRouter.get('/tickets/:shareCode', (req, res, next) =>
  publicTicketController.getByShareCode(req, res, next),
);
