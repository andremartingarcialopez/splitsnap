import { z } from 'zod';

export const startDivisionSchema = z.object({
  globalTipPercentage: z.coerce.number().min(0).max(100).optional(),
  expectedParticipantCount: z.coerce.number().int().min(1).max(99).optional(),
  adminDisplayName: z.string().trim().min(1).max(100).optional(),
  adminAvatarId: z.string().trim().min(1).max(50).optional(),
});

export const adminSetupSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  avatarId: z.string().trim().min(1).max(50).optional(),
});

export const collaborationSettingsSchema = z.object({
  globalTipPercentage: z.coerce.number().min(0).max(100).optional(),
  expectedParticipantCount: z.coerce.number().int().min(1).max(99).optional().nullable(),
});

export type StartDivisionInput = z.infer<typeof startDivisionSchema>;
export type AdminSetupInput = z.infer<typeof adminSetupSchema>;
export type CollaborationSettingsInput = z.infer<typeof collaborationSettingsSchema>;

export const shareCodeParamSchema = z.object({
  shareCode: z
    .string()
    .trim()
    .min(4)
    .max(16)
    .regex(/^[A-Z0-9]+$/),
});
