import { z } from 'zod'

export const CreateIncomeSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter').max(100),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  fundId: z.string().min(1, 'Pos Dana harus dipilih'),
  date: z.coerce.date(),
  description: z.string().optional()
})

export const UpdateIncomeSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter').max(100).optional(),
  amount: z.number().positive('Jumlah harus lebih dari 0').optional(),
  fundId: z.string().min(1, 'Pos Dana harus dipilih').optional(),
  date: z.coerce.date().optional(),
  description: z.string().optional()
})

export type CreateIncomeInput = z.infer<typeof CreateIncomeSchema>
export type UpdateIncomeInput = z.infer<typeof UpdateIncomeSchema>
