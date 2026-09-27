import { NextResponse } from 'next/server'
import { getPublicBillingSummary } from '@/lib/services/dashboard.service'

export async function GET() {
  try {
    const summary = await getPublicBillingSummary()
    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
