import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        amountTotal: true,
        expiredAt: true,
        memberBilling: {
          select: {
            status: true
          }
        }
      }
    })

    if (!paymentRequest) {
      return NextResponse.json(
        { error: 'Request pembayaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika status PENDING tapi sudah melewati batas waktu expired,
    // update status secara pasif ke EXPIRED
    const now = new Date()
    let currentStatus = paymentRequest.status
    if (currentStatus === 'PENDING' && paymentRequest.expiredAt < now) {
      await prisma.paymentRequest.update({
        where: { id },
        data: { status: 'EXPIRED' }
      })
      currentStatus = 'EXPIRED'
    }

    return NextResponse.json({
      success: true,
      status: currentStatus,
      billingStatus: paymentRequest.memberBilling.status
    })
  } catch (error) {
    console.error('[API] Error saat mengecek status pembayaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
