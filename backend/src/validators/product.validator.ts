import { z } from 'zod';

export const createProductSchema = z.object({
  ticketId: z.string().uuid('ticketId must be a UUID'),
  name: z.string().trim().min(1, 'name is required').max(150),
  unitPrice: z.coerce.number().positive('unitPrice must be > 0'),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    unitPrice: z.coerce.number().positive('unitPrice must be > 0').optional(),
  })
  .refine((d) => d.name !== undefined || d.unitPrice !== undefined, {
    message: 'At least one of name or unitPrice is required',
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
