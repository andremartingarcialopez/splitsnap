import { z } from 'zod';

export const assignOneSchema = z.object({
  productId: z.string().uuid('productId must be a UUID'),
  participantId: z.string().uuid('participantId must be a UUID'),
  /** MDD: reparto equitativo MVP → default 1 */
  shareRatio: z.coerce.number().positive('shareRatio must be > 0').optional().default(1),
});

export const assignSharedSchema = z.object({
  productId: z.string().uuid('productId must be a UUID'),
  participantIds: z
    .array(z.string().uuid())
    .min(2, 'Shared assignment requires at least 2 participants'),
  /**
   * Ratios opcionales alineados 1:1 con participantIds.
   * Si se omiten, cada uno recibe shareRatio = 1 (MDD equitativo).
   */
  shareRatios: z.array(z.coerce.number().positive()).optional(),
});

export type AssignOneInput = z.infer<typeof assignOneSchema>;
export type AssignSharedInput = z.infer<typeof assignSharedSchema>;
