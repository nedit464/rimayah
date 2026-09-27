import { z } from 'zod'

export const CreateExpenseSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter').max(100),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  category: z.enum(['PERALATAN', 'KONSUMSI', 'EVENT', 'OPERASIONAL', 'TRANSPORTASI', 'LAINNYA']),
  fundId: z.string().min(1, 'Dana harus dipilih'),
  date: z.coerce.date(),
  description: z.string().optional()
})

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>
