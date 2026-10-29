import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllMembers, createMember } from '@/lib/services/member.service'
import { CreateMemberSchema } from '@/lib/validations/member.schema'

export async function GET() {
  try {
    await requireAdmin()
    const members = await getAllMembers()
    return NextResponse.json(members)
  } catch (error) {
    console.error('GET /api/admin/members error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const parsed = CreateMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const member = await createMember(parsed.data)
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Create member error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
