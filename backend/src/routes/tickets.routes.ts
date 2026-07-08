import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { assignmentController } from '../controllers/assignment.controller';
import { calculationController } from '../controllers/calculation.controller';
import { uploadTicketImage } from '../middleware/upload';
import { pipelineRateLimit } from '../middleware/rateLimit';

export const ticketRouter = Router();

ticketRouter.get('/', (req, res, next) => ticketController.list(req, res, next));
ticketRouter.post('/', (req, res, next) => ticketController.create(req, res, next));

ticketRouter.post(
  '/process',
  pipelineRateLimit,
  uploadTicketImage,
  (req, res, next) => ticketController.process(req, res, next),
);

ticketRouter.post('/manual', (req, res, next) =>
  ticketController.createManual(req, res, next),
);

// Multi-segment routes before bare /:id where needed
ticketRouter.get('/:ticketId/assignments', (req, res, next) =>
  assignmentController.listByTicket(req, res, next),
);

ticketRouter.get('/:ticketId/summary', (req, res, next) =>
  calculationController.summary(req, res, next),
);

ticketRouter.post('/:ticketId/calculate', (req, res, next) =>
  calculationController.calculate(req, res, next),
);

ticketRouter.get('/:id', (req, res, next) =>
  ticketController.getById(req, res, next),
);

ticketRouter.delete('/:id', (req, res, next) =>
  ticketController.remove(req, res, next),
);

ticketRouter.post('/:id/participants', (req, res, next) =>
  ticketController.addParticipant(req, res, next),
);

ticketRouter.get('/:id/participants/:participantId/remove-preview', (req, res, next) =>
  ticketController.previewRemoveParticipant(req, res, next),
);

ticketRouter.delete('/:id/participants/:participantId', (req, res, next) =>
  ticketController.removeParticipant(req, res, next),
);

ticketRouter.put('/:id/tip', (req, res, next) =>
  ticketController.updateTip(req, res, next),
);

ticketRouter.put('/:id/participants/:participantId/tip', (req, res, next) =>
  ticketController.updateParticipantTip(req, res, next),
);

ticketRouter.post('/:id/finalize', (req, res, next) =>
  ticketController.finalize(req, res, next),
);

ticketRouter.post('/:id/groups', (req, res, next) =>
  ticketController.linkGroup(req, res, next),
);

ticketRouter.post('/:id/products', (req, res, next) =>
  ticketController.addProduct(req, res, next),
);

ticketRouter.put('/:id/products/:productId', (req, res, next) =>
  ticketController.updateProduct(req, res, next),
);

ticketRouter.delete('/:id/products/:productId', (req, res, next) =>
  ticketController.deleteProduct(req, res, next),
);
