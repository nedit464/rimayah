import { z } from 'zod'

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi')
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Password baru tidak cocok',
  path: ['confirmPassword']
})

export type LoginInput = z.infer<typeof LoginSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
