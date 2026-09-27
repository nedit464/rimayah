import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllPayments, getPendingVerifications } from '@/lib/services/payment.service'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const pending = searchParams.get('pending')

    if (pending === 'true') {
      const payments = await getPendingVerifications()
      return NextResponse.json(payments)
    }

    const payments = await getAllPayments({
      status: searchParams.get('status') ?? undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      search: searchParams.get('search') ?? undefined,
    })
    return NextResponse.json(payments)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
