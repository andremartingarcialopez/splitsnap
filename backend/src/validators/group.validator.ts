import { z } from 'zod';

const participantIdsSchema = z.array(z.string().uuid()).optional().default([]);

/** POST /api/v1/groups — name requerido, max 100; description opcional max 255 */
export const createGroupSchema = z.object({
  name: z
    .string({ required_error: 'name is required' })
    .trim()
    .min(1, 'name is required')
    .max(100, 'name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(255, 'description must be at most 255 characters')
    .optional()
    .nullable(),
  participantIds: participantIdsSchema,
});

/** PUT /api/v1/groups/{id} — al menos un campo */
export const updateGroupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'name cannot be empty')
      .max(100, 'name must be at most 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(255, 'description must be at most 255 characters')
      .optional()
      .nullable(),
    participantIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.participantIds !== undefined,
    { message: 'At least one of name, description or participantIds is required' },
  );

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
