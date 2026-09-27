import { cookies } from 'next/headers'
import { prisma } from './db'

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { admin: { select: { id: true, username: true } } }
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {})
    }
    return null
  }

  return session.admin
}

export async function requireAdmin() {
  const admin = await getSession()
  if (!admin) {
    throw new Error('Unauthorized')
  }
  return admin
}

export async function createSession(adminId: string): Promise<string> {
  const session = await prisma.adminSession.create({
    data: {
      adminId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })
  return session.token
}

export async function deleteSession(token: string) {
  await prisma.adminSession.delete({ where: { token } }).catch(() => {})
}
