import { z } from 'zod';

export const updateTicketTipSchema = z.object({
  tipMode: z.enum(['GLOBAL', 'INDIVIDUAL']),
  globalTipPercentage: z.coerce.number().min(0).max(100),
});

export const updateParticipantTipSchema = z.object({
  individualTipPercentage: z.coerce.number().min(0).max(100),
});

export type UpdateTicketTipInput = z.infer<typeof updateTicketTipSchema>;
export type UpdateParticipantTipInput = z.infer<typeof updateParticipantTipSchema>;
