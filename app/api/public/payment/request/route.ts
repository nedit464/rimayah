import { NextResponse } from 'next/server'
import { createPaymentRequest } from '@/lib/services/payment-gate.service'
import { z } from 'zod'

const PaymentRequestSchema = z.object({
  memberBillingId: z.string().min(1, 'ID tagihan wajib diisi'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'QRIS']),
  bankCode: z.string().min(1, 'Kode bank wajib diisi')
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = PaymentRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Input data tidak valid', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { memberBillingId, paymentMethod, bankCode } = parsed.data
    const result = await createPaymentRequest(memberBillingId, paymentMethod, bankCode)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[API] Error saat membuat request pembayaran:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
