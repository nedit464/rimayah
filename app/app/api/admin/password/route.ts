import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChangePasswordSchema } from '@/lib/validations/auth.schema'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const parsed = ChangePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const adminRecord = await prisma.admin.findUnique({ where: { id: admin.id } })
    if (!adminRecord || !(await bcrypt.compare(parsed.data.currentPassword, adminRecord.passwordHash))) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: newHash }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
