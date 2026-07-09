import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { ticketService } from '../modules/ticket/ticket.service';
import {
  addTicketParticipantSchema,
  createTicketSchema,
  linkTicketGroupSchema,
} from '../validators/ticket.validator';
import {
  updateParticipantTipSchema,
  updateTicketTipSchema,
} from '../validators/tip.validator';
import { collaborationService } from '../modules/collaboration/collaboration.service';
import {
  adminSetupSchema,
  collaborationSettingsSchema,
  startDivisionSchema,
} from '../validators/collaboration.validator';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';

const manualSchema = z.object({
  title: z.string().trim().max(150).optional(),
  restaurantName: z.string().trim().max(150).optional().nullable(),
  products: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(150),
        unitPrice: z.coerce.number().positive(),
      }),
    )
    .min(1),
});

const productSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  unitPrice: z.coerce.number().positive().optional(),
});

export class TicketController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tickets = await ticketService.list();
      sendSuccess(res, tickets, 'Tickets retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createTicketSchema.parse(req.body);
      const ticket = await ticketService.create(body);
      sendSuccess(res, ticket, 'Ticket created', 201);
    } catch (err) {
      next(err);
    }
  }

  async process(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('image file is required (field: image)', 'VALIDATION_ERROR', 400);
      }

      const result = await ticketService.processImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });

      sendSuccess(
        res,
        {
          ...result,
          pipeline: { mock: env.useMockPipeline },
        },
        'Ticket procesado correctamente.',
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.getById(req.params.id);
      sendSuccess(res, ticket, 'Ticket retrieved');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.remove(req.params.id);
      sendSuccess(res, result, 'Ticket deleted');
    } catch (err) {
      next(err);
    }
  }

  async createManual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = manualSchema.parse(req.body);
      const ticket = await ticketService.createManual(body);
      sendSuccess(res, ticket, 'Manual ticket created', 201);
    } catch (err) {
      next(err);
    }
  }

  async addParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = addTicketParticipantSchema.parse(req.body);
      const ticket = await ticketService.addParticipant(req.params.id, body);
      sendSuccess(res, ticket, 'Participant added to ticket');
    } catch (err) {
      next(err);
    }
  }

  async previewRemoveParticipant(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const preview = await ticketService.previewRemoveParticipant(
        req.params.id,
        req.params.participantId,
      );
      sendSuccess(res, preview, 'Remove preview');
    } catch (err) {
      next(err);
    }
  }

  async removeParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.removeParticipant(
        req.params.id,
        req.params.participantId,
      );
      sendSuccess(res, result, 'Participant removed from ticket');
    } catch (err) {
      next(err);
    }
  }

  async updateTip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = updateTicketTipSchema.parse(req.body);
      const ticket = await ticketService.updateTip(req.params.id, body);
      sendSuccess(res, ticket, 'Tip configuration updated');
    } catch (err) {
      next(err);
    }
  }

  async updateParticipantTip(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = updateParticipantTipSchema.parse(req.body);
      const ticket = await ticketService.updateParticipantTip(
        req.params.id,
        req.params.participantId,
        body,
      );
      sendSuccess(res, ticket, 'Participant tip updated');
    } catch (err) {
      next(err);
    }
  }

  async finalize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.finalize(req.params.id);
      sendSuccess(res, ticket, 'Ticket finalized');
    } catch (err) {
      next(err);
    }
  }

  async linkGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = linkTicketGroupSchema.parse(req.body);
      const ticket = await ticketService.linkGroup(req.params.id, body.groupId);
      sendSuccess(res, ticket, 'Group linked to ticket');
    } catch (err) {
      next(err);
    }
  }

  async addProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = productSchema
        .refine((d) => d.name && d.unitPrice != null, {
          message: 'name and unitPrice are required',
        })
        .parse(req.body);
      const product = await ticketService.addProduct(req.params.id, {
        name: body.name!,
        unitPrice: body.unitPrice!,
      });
      sendSuccess(res, product, 'Product added', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = productSchema.parse(req.body);
      const product = await ticketService.updateProduct(
        req.params.id,
        req.params.productId,
        body,
      );
      sendSuccess(res, product, 'Product updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.deleteProduct(
        req.params.id,
        req.params.productId,
      );
      sendSuccess(res, result, 'Product deleted');
    } catch (err) {
      next(err);
    }
  }

  async startDivision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = startDivisionSchema.parse(req.body ?? {});
      const share = await collaborationService.startDivision(req.params.id, body);
      sendSuccess(res, share, 'Division started', 201);
    } catch (err) {
      next(err);
    }
  }

  async setupAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = adminSetupSchema.parse(req.body ?? {});
      await collaborationService.setupAdmin(req.params.id, body);
      const ticket = await ticketService.getById(req.params.id);
      sendSuccess(res, ticket, 'Admin configured');
    } catch (err) {
      next(err);
    }
  }

  async updateCollaborationSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = collaborationSettingsSchema.parse(req.body ?? {});
      await collaborationService.updateCollaborationSettings(req.params.id, body);
      const ticket = await ticketService.getById(req.params.id);
      sendSuccess(res, ticket, 'Collaboration settings updated');
    } catch (err) {
      next(err);
    }
  }

  async getShareInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const share = await collaborationService.getShareInfo(req.params.id);
      sendSuccess(res, share, 'Share info');
    } catch (err) {
      next(err);
    }
  }
}

export const ticketController = new TicketController();
