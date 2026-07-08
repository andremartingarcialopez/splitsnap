import { Router } from 'express';
import { participantController } from '../modules/participant/participant.controller';
import { uploadParticipantImage } from '../middleware/upload';
import { validateBody } from '../middleware/validate';
import {
  createParticipantSchema,
  updateParticipantSchema,
} from '../validators/participant.validator';

export const participantRouter = Router();

participantRouter.get('/', (req, res, next) =>
  participantController.list(req, res, next),
);
participantRouter.post('/photo', uploadParticipantImage, (req, res, next) =>
  participantController.uploadPhoto(req, res, next),
);
participantRouter.post('/', validateBody(createParticipantSchema), (req, res, next) =>
  participantController.create(req, res, next),
);
participantRouter.get('/:id', (req, res, next) =>
  participantController.getById(req, res, next),
);
participantRouter.put(
  '/:id',
  validateBody(updateParticipantSchema),
  (req, res, next) => participantController.update(req, res, next),
);
participantRouter.delete('/:id', (req, res, next) =>
  participantController.remove(req, res, next),
);
