import { Router } from 'express';
import { publicTicketController } from '../controllers/publicTicket.controller';

export const publicRouter = Router();

publicRouter.get('/tickets/:shareCode', (req, res, next) =>
  publicTicketController.getByShareCode(req, res, next),
);

publicRouter.post('/tickets/:shareCode/join', (req, res, next) =>
  publicTicketController.join(req, res, next),
);

publicRouter.get('/tickets/:shareCode/participants/:ticketParticipantId', (req, res, next) =>
  publicTicketController.getParticipantSession(req, res, next),
);

publicRouter.post(
  '/tickets/:shareCode/participants/:ticketParticipantId/toggle-product',
  (req, res, next) => publicTicketController.toggleProduct(req, res, next),
);

publicRouter.post(
  '/tickets/:shareCode/participants/:ticketParticipantId/submit',
  (req, res, next) => publicTicketController.submitSelection(req, res, next),
);
