'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { useCounterAnimation } from '@/hooks/use-counter-animation'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { MonthlyChartData, TransactionItem } from '@/types'

interface TransparencyData {
  summary: {
    totalBalance: number
    incomeThisMonth: number
    expenseThisMonth: number
    activeMembers: number
  }
  chartData: MonthlyChartData[]
  recentTransactions: TransactionItem[]
  funds: { id: string; name: string; balance: number; color: string | null; description: string | null }[]
}

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCounterAnimation(value)
  return (
    <span className="font-mono-num">
      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(animated)}
    </span>
  )
}

export default function TransparansiPage() {
  const [data, setData] = useState<TransparencyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/transparency')
      .then(res => {
        if (!res.ok) throw new Error('API error')
        return res.json()
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-20">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-12">
          <h1 className="font-heading text-3xl md:text-4xl text-text-primary mb-3">Transparansi Keuangan</h1>
          <p className="text-text-tertiary max-w-md mx-auto">Data keuangan organisasi yang terbuka dan dapat diakses oleh seluruh anggota.</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div {...staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Wallet, label: 'Total Seluruh Dana', value: data.summary.totalBalance, color: 'text-emerald-bright' },
            { icon: TrendingUp, label: 'Pemasukan Bulan Ini', value: data.summary.incomeThisMonth, color: 'text-emerald-bright' },
            { icon: TrendingDown, label: 'Pengeluaran Bulan Ini', value: data.summary.expenseThisMonth, color: 'text-danger' },
            { icon: Users, label: 'Anggota Aktif', value: data.summary.activeMembers, color: 'text-info', isCount: true },
          ].map((item, i) => (
            <motion.div key={i} {...fadeUp} className="card-featured p-6">
              <item.icon className={`w-5 h-5 ${item.color} mb-3`} />
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>
                {'isCount' in item ? <span className="font-mono-num">{data.summary.activeMembers}</span> : <AnimatedCurrency value={item.value || 0} />}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Fund Balances */}
        <motion.div {...fadeUp} className="mb-12">
          <h2 className="font-heading text-2xl text-text-primary mb-6">Saldo Dana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.funds.map(fund => (
              <div key={fund.id} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: fund.color ?? '#059669' }}
                  />
                  <h3 className="text-sm font-semibold text-text-primary">{fund.name}</h3>
                </div>
                <p className="font-mono-num text-2xl font-bold text-text-primary">
                  {formatRupiah(Number(fund.balance))}
                </p>
                {fund.description && (
                  <p className="text-xs text-text-tertiary mt-2">{fund.description}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div {...fadeUp} className="card p-6 mb-12">
          <h2 className="font-heading text-xl text-text-primary mb-6">Pemasukan vs Pengeluaran (6 Bulan Terakhir)</h2>
          <MonthlyChart data={data.chartData} />
        </motion.div>

        {/* Recent Transactions */}
        <motion.div {...fadeUp} className="card overflow-hidden">
          <div className="p-6 border-b border-border-subtle">
            <h2 className="font-heading text-xl text-text-primary">Transaksi Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Dana</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="font-mono-num text-xs">{formatDateShort(tx.date)}</td>
                    <td className="font-medium text-text-primary">{tx.title}</td>
                    <td>{tx.fundName}</td>
                    <td className="text-right">
                      <CurrencyDisplay
                        amount={tx.amount}
                        type={tx.type}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
