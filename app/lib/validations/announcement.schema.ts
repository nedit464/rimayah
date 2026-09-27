import { z } from 'zod'

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200),
  content: z.string().min(10, 'Konten minimal 10 karakter'),
  type: z.enum(['FINANCE_NOTICE', 'PAYMENT_REMINDER', 'ORGANIZATION_UPDATE']),
  isPinned: z.boolean().default(false),
  isVisible: z.boolean().default(true)
})

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial()

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>
