import { z } from 'zod';

const nameField = z
  .string()
  .trim()
  .max(100, 'name must be at most 100 characters')
  .optional()
  .nullable();

/** URL externa o ruta servida por la API (/uploads/...) */
const photoUrlField = z
  .union([
    z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
        { message: 'photoUrl must be a valid URL or /uploads path' },
      ),
    z.literal(''),
    z.null(),
  ])
  .optional();

/** POST /api/v1/participants — al menos name o photoUrl (MDD §3) */
export const createParticipantSchema = z
  .object({
    name: nameField,
    photoUrl: photoUrlField,
  })
  .superRefine((data, ctx) => {
    const name = data.name?.trim() || null;
    const photoUrl = data.photoUrl && data.photoUrl.length > 0 ? data.photoUrl : null;
    if (!name && !photoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least name or photoUrl is required',
        path: ['name'],
      });
    }
  })
  .transform((data) => ({
    name: data.name?.trim() ? data.name.trim() : null,
    photoUrl: data.photoUrl && data.photoUrl.length > 0 ? data.photoUrl : null,
  }));

/** PUT /api/v1/participants/{id} */
export const updateParticipantSchema = z
  .object({
    name: nameField,
    photoUrl: photoUrlField,
  })
  .refine((data) => data.name !== undefined || data.photoUrl !== undefined, {
    message: 'At least one of name or photoUrl is required',
  })
  .transform((data) => ({
    name: data.name === undefined ? undefined : data.name?.trim() ? data.name.trim() : null,
    photoUrl:
      data.photoUrl === undefined
        ? undefined
        : data.photoUrl && data.photoUrl.length > 0
          ? data.photoUrl
          : null,
  }));

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
