import { NextResponse } from 'next/server'
import { confirmPaymentByMember } from '@/lib/services/payment.service'
import { z } from 'zod'

const ConfirmPaymentSchema = z.object({
  memberBillingId: z.string().min(1)
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = ConfirmPaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }

    await confirmPaymentByMember(parsed.data.memberBillingId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
