import { NextResponse } from 'next/server'
import { getPublicAnnouncements } from '@/lib/services/announcement.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')

    const result = await getPublicAnnouncements(page, limit)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
