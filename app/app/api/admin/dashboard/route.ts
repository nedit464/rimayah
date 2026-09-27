import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDashboardStats, getMonthlyChartData, getRecentTransactions, getOverdueMembers } from '@/lib/services/dashboard.service'

export async function GET() {
  try {
    await requireAdmin()
    const [stats, chartData, recentTransactions, overdueMembers] = await Promise.all([
      getDashboardStats(),
      getMonthlyChartData(),
      getRecentTransactions(),
      getOverdueMembers()
    ])

    return NextResponse.json({ stats, chartData, recentTransactions, overdueMembers })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
