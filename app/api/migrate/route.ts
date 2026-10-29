import { NextResponse } from 'next/server'
import { ensureDbSchema, pool } from '@/lib/db'

export async function GET() {
  try {
    await ensureDbSchema()
    const result = await pool.query(`
      ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);
    `)
    return NextResponse.json({
      success: true,
      message: 'Database schema migration executed successfully',
      result
    })
  } catch (error: any) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
