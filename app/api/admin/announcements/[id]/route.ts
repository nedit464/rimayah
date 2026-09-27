import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateAnnouncement, deleteAnnouncement } from '@/lib/services/announcement.service'
import { UpdateAnnouncementSchema } from '@/lib/validations/announcement.schema'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const announcement = await updateAnnouncement(id, parsed.data)
    return NextResponse.json(announcement)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    await deleteAnnouncement(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
