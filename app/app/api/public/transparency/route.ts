import { NextResponse } from 'next/server'
import { getPublicBillingSummary, getMonthlyChartData, getRecentTransactions } from '@/lib/services/dashboard.service'
import { getAllFunds } from '@/lib/services/fund.service'

export async function GET() {
  try {
    const summary = await getPublicBillingSummary()
    const chartData = await getMonthlyChartData()
    const recentTransactions = await getRecentTransactions(20)
    const funds = await getAllFunds()

    const sanitizedFunds = funds.map(f => ({
      id: f.id,
      name: f.name,
      balance: f.balance.toNumber(),
      color: f.color,
      description: f.description
    }))

    return NextResponse.json({ summary, chartData, recentTransactions, funds: sanitizedFunds })
  } catch (err: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: err.message, stack: err.stack }, { status: 500 })
  }
}
