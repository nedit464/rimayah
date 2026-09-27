import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateMonthlyBilling } from '@/lib/services/billing.service'
import { GenerateMonthlyBillingSchema } from '@/lib/validations/billing.schema'

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const parsed = GenerateMonthlyBillingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const billing = await generateMonthlyBilling(parsed.data.month, parsed.data.year, parsed.data.roles, parsed.data.amount)
    return NextResponse.json(billing, { status: 201 })
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
