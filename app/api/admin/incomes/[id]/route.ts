import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { deleteIncome, updateIncome } from '@/lib/services/fund.service'
import { UpdateIncomeSchema } from '@/lib/validations/income.schema'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const deleted = await deleteIncome(id)
    return NextResponse.json(deleted)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateIncomeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await updateIncome(id, {
      title: parsed.data.title,
      amount: parsed.data.amount,
      date: parsed.data.date,
      description: parsed.data.description,
      fundId: parsed.data.fundId,
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
