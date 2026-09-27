import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllBillings, createCustomBilling } from '@/lib/services/billing.service'
import { CreateCustomBillingSchema } from '@/lib/validations/billing.schema'

export async function GET() {
  try {
    await requireAdmin()
    const billings = await getAllBillings()
    return NextResponse.json(billings)
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
    const parsed = CreateCustomBillingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const billing = await createCustomBilling(
      parsed.data.title,
      parsed.data.amount,
      parsed.data.dueDate,
      parsed.data.fundId,
      parsed.data.description,
      parsed.data.memberIds,
      parsed.data.roles
    )
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
