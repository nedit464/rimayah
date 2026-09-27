import { z } from 'zod'

export const CreateFundSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Format warna harus hex (#RRGGBB)').optional()
})

export const UpdateFundSchema = CreateFundSchema.partial()

export type CreateFundInput = z.infer<typeof CreateFundSchema>
export type UpdateFundInput = z.infer<typeof UpdateFundSchema>
