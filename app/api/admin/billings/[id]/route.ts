import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateBilling, deleteBilling } from '@/lib/services/billing.service'
import { UpdateBillingSchema } from '@/lib/validations/billing.schema'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateBillingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const billing = await updateBilling(id, parsed.data)
    return NextResponse.json(billing)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    // Prefer params.id, but fall back to parsing from URL or request body for robustness
    let { id } = await params
    if (!id) {
      try {
        const body = await request.json().catch(() => null)
        if (body && body.id) id = body.id
      } catch {}
    }
    if (!id) {
      try {
        const url = new URL(request.url)
        const parts = url.pathname.split('/').filter(Boolean)
        // expect [..., 'admin', 'billings', ':id']
        const last = parts[parts.length - 1]
        if (last && last !== 'billings') id = last
      } catch {}
    }

    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    await deleteBilling(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Terjadi kesalahan server' }, { status: 500 })
  }
}
