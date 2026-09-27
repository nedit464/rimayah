import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getFundById, updateFund, deleteFund } from '@/lib/services/fund.service'
import { UpdateFundSchema } from '@/lib/validations/fund.schema'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const fund = await getFundById(id)
    if (!fund) return NextResponse.json({ error: 'Dana tidak ditemukan' }, { status: 404 })
    return NextResponse.json(fund)
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
    const parsed = UpdateFundSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const fund = await updateFund(id, parsed.data)
    return NextResponse.json(fund)
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
    await deleteFund(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
