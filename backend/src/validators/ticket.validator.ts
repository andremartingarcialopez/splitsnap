import { z } from 'zod';

export const tipModeSchema = z.enum(['GLOBAL', 'INDIVIDUAL']);

export const createTicketSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  restaurantName: z.string().trim().max(150).optional().nullable(),
  ticketImageUrl: z.string().trim().max(500).optional(),
  subtotal: z.coerce.number().nonnegative().optional().nullable(),
  tax: z.coerce.number().nonnegative().optional().nullable(),
  discount: z.coerce.number().nonnegative().optional().nullable(),
  total: z.coerce.number().nonnegative().optional().nullable(),
  tipMode: tipModeSchema.optional().default('GLOBAL'),
  globalTipPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  participantIds: z.array(z.string().uuid()).optional().default([]),
  groupIds: z.array(z.string().uuid()).optional().default([]),
  products: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(150),
        unitPrice: z.coerce.number().positive(),
      }),
    )
    .optional()
    .default([]),
});

export const addTicketParticipantSchema = z.object({
  participantId: z.string().uuid('participantId must be a UUID'),
  individualTipPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
});

export const linkTicketGroupSchema = z.object({
  groupId: z.string().uuid('groupId must be a UUID'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddTicketParticipantInput = z.infer<typeof addTicketParticipantSchema>;
