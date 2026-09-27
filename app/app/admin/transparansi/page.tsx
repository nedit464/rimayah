'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, Eye, FileSpreadsheet } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { MonthlyChartData, TransactionItem } from '@/types'

interface Fund {
  id: string
  name: string
  balance: number
  color: string | null
}

interface TransparansiData {
  summary: {
    totalBalance: number
    incomeThisMonth: number
    expenseThisMonth: number
    activeMembers: number
  }
  chartData: MonthlyChartData[]
  recentTransactions: TransactionItem[]
  funds: Fund[]
}

export default function AdminTransparansiPage() {
  const [data, setData] = useState<TransparansiData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTransparansi = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/transparency')
      if (!res.ok) throw new Error('API error')
      setData(await res.json())
    } catch {
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTransparansi()
  }, [])

  return (
    <div>
      <AdminTopbar
        title="Laporan Transparansi"
        description="Analisis dan laporan transparansi kas untuk publik"
      />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Summary */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : data ? (
          <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wallet, label: 'Total Dana Seluruhnya', value: data.summary.totalBalance, color: 'text-emerald-bright' },
              { icon: TrendingUp, label: 'Pemasukan Bulan Ini', value: data.summary.incomeThisMonth, color: 'text-emerald-bright' },
              { icon: TrendingDown, label: 'Pengeluaran Bulan Ini', value: data.summary.expenseThisMonth, color: 'text-danger' },
              { icon: Eye, label: 'Status Laporan', value: 'Terbuka Ke Publik', color: 'text-info', isStatus: true },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} className="card-featured p-5">
                <item.icon className={`w-5 h-5 ${item.color} mb-3`} />
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>
                  {item.isStatus ? item.value : formatRupiah(Number(item.value || 0))}
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {/* Chart */}
        <motion.div {...fadeUp} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-text-primary">Kurva Pemasukan vs Pengeluaran</h3>
            <button className="btn btn-secondary btn-sm gap-1.5" title="Fitur Ekspor Laporan">
              <FileSpreadsheet className="w-4 h-4" /> Ekspor CSV
            </button>
          </div>
          {data?.chartData ? <MonthlyChart data={data.chartData} /> : <div className="h-[300px] skeleton rounded-lg" />}
        </motion.div>

        {/* Recent Mutations */}
        <motion.div {...fadeUp} className="card overflow-hidden">
          <div className="p-4 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-text-primary">Daftar Mutasi Kas Lengkap</h3>
          </div>
          <div className="overflow-x-auto">
            {data?.recentTransactions ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama Transaksi</th>
                    <th>Dana Sumber/Tujuan</th>
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
                        <CurrencyDisplay amount={tx.amount} type={tx.type} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm text-text-tertiary">Belum ada transaksi.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
