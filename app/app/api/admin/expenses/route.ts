import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getExpenses, recordExpense } from '@/lib/services/fund.service'
import { CreateExpenseSchema } from '@/lib/validations/expense.schema'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const expenses = await getExpenses({
      fundId: searchParams.get('fundId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
    })
    return NextResponse.json(expenses)
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
    const parsed = CreateExpenseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const expense = await recordExpense(
      parsed.data.fundId,
      parsed.data.title,
      parsed.data.amount,
      parsed.data.category,
      parsed.data.date,
      parsed.data.description
    )
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
