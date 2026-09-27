import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllAnnouncements, createAnnouncement } from '@/lib/services/announcement.service'
import { CreateAnnouncementSchema } from '@/lib/validations/announcement.schema'

export async function GET() {
  try {
    await requireAdmin()
    const announcements = await getAllAnnouncements()
    return NextResponse.json(announcements)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const parsed = CreateAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const announcement = await createAnnouncement(parsed.data)
    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
