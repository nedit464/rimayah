import { NextResponse } from 'next/server'
import { searchMembersByName } from '@/lib/services/member.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const members = await searchMembersByName(query)

    // Sanitize: only return name, status, and billing info (no IDs exposed unnecessarily)
    const sanitized = members.map(m => ({
      id: m.id,
      name: m.name,
      status: m.status,
      memberBillings: m.memberBillings.map(mb => ({
        id: mb.id,
        status: mb.status,
        paidAt: mb.paidAt,
        billing: {
          id: mb.billing.id,
          title: mb.billing.title,
          amount: mb.billing.amount,
          dueDate: mb.billing.dueDate,
          type: mb.billing.type
        }
      }))
    }))

    return NextResponse.json(sanitized)
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
