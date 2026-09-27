import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getMemberById, updateMember, deleteMember } from '@/lib/services/member.service'
import { UpdateMemberSchema } from '@/lib/validations/member.schema'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const member = await getMemberById(id)
    if (!member) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const member = await updateMember(id, parsed.data)
    return NextResponse.json(member)
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
    await deleteMember(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
