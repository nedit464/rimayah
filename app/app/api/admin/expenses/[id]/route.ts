import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { deleteExpense, updateExpense } from '@/lib/services/fund.service'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const deleted = await deleteExpense(id)
    return NextResponse.json(deleted)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
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

    const updated = await updateExpense(id, {
      title: body.title,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      category: body.category,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
      fundId: body.fundId,
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
