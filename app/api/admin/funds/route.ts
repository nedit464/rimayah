import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllFunds, createFund } from '@/lib/services/fund.service'
import { CreateFundSchema } from '@/lib/validations/fund.schema'

export async function GET() {
  try {
    await requireAdmin()
    const funds = await getAllFunds()
    return NextResponse.json(funds)
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
    const parsed = CreateFundSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const fund = await createFund(parsed.data)
    return NextResponse.json(fund, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
