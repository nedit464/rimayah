import { z } from 'zod'

export const GenerateMonthlyBillingSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2025),
  // Optional array of role strings; if omitted, all roles are billed
  roles: z.array(z.enum(['MUASSIS', 'ANGGOTA'])).optional(),
  // Optional amount override for this month (in IDR)
  amount: z.number().positive().optional()
})

export const CreateCustomBillingSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(100),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  dueDate: z.coerce.date(),
  fundId: z.string().min(1, 'Dana harus dipilih'),
  description: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  roles: z.array(z.enum(['MUASSIS', 'ANGGOTA'])).optional()
})

export const UpdateBillingSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
  fundId: z.string().min(1).optional(),
  description: z.string().optional(),
  roles: z.array(z.enum(['MUASSIS', 'ANGGOTA'])).optional()
})

export type GenerateMonthlyBillingInput = z.infer<typeof GenerateMonthlyBillingSchema>
export type CreateCustomBillingInput = z.infer<typeof CreateCustomBillingSchema>
export type UpdateBillingInput = z.infer<typeof UpdateBillingSchema>
