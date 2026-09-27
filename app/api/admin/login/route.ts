import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { LoginSchema } from '@/lib/validations/auth.schema'
import { createSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.log('[Login API] Attempting login for username:', parsed.data.username)
    const dbUrl = process.env.DATABASE_URL || ''
    const dbHost = dbUrl.split('@')[1] || 'local'
    console.log('[Login API] Connecting to database host:', dbHost.split('?')[0])

    const admin = await prisma.admin.findUnique({
      where: { username: parsed.data.username }
    })

    if (!admin) {
      console.log('[Login API] Admin NOT found in database!')
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    console.log('[Login API] Admin found. Comparing password...')
    const isPasswordMatch = await bcrypt.compare(parsed.data.password, admin.passwordHash)
    console.log('[Login API] Password match result:', isPasswordMatch)

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const token = await createSession(admin.id)

    const cookieStore = await cookies()
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/'
    })

    return NextResponse.json({ success: true, admin: { id: admin.id, username: admin.username } })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
