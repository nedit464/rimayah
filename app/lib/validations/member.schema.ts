import { z } from 'zod'

export const CreateMemberSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  joinDate: z.coerce.date().min(new Date('2025-12-01'), {
    message: 'Tanggal bergabung minimal Desember 2025'
  }),
  status: z.enum(['AKTIF', 'NONAKTIF']).default('AKTIF'),
  role: z.enum(['MUASSIS', 'ANGGOTA']).default('ANGGOTA'),
  monthlyFee: z.number().nonnegative().optional()
})

export const UpdateMemberSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  joinDate: z.coerce.date().min(new Date('2025-12-01'), {
    message: 'Tanggal bergabung minimal Desember 2025'
  }).optional(),
  status: z.enum(['AKTIF', 'NONAKTIF']).optional(),
  role: z.enum(['MUASSIS', 'ANGGOTA']).optional(),
  monthlyFee: z.number().nonnegative().optional()
})

export type CreateMemberInput = z.infer<typeof CreateMemberSchema>
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>
