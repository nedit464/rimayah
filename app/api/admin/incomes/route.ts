import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getIncomes, recordIncome } from '@/lib/services/fund.service'
import { CreateIncomeSchema } from '@/lib/validations/income.schema'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const incomes = await getIncomes({
      fundId: searchParams.get('fundId') ?? undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      customOnly: searchParams.get('customOnly') === 'false' ? false : true,
    })
    return NextResponse.json(incomes)
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
    const parsed = CreateIncomeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const income = await recordIncome(
      parsed.data.fundId,
      parsed.data.title,
      parsed.data.amount,
      parsed.data.date,
      parsed.data.description
    )
    return NextResponse.json(income, { status: 201 })
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
