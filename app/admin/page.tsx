'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Users, Plus, Receipt, ArrowDownCircle, Megaphone } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { StatCard } from '@/components/admin/StatCard'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { staggerContainer, fadeUp } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { DashboardStats, MonthlyChartData, TransactionItem } from '@/types'

interface OverdueMember {
  id: string
  member: { name: string }
  billing: { title: string; amount: number; dueDate: string }
}

export default function AdminDashboard() {
  const [data, setData] = useState<{
    stats: DashboardStats
    chartData: MonthlyChartData[]
    recentTransactions: TransactionItem[]
    overdueMembers: OverdueMember[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          console.error(resData.error);
          setData(null);
        } else {
          setData(resData);
        }
      })
      .catch(err => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false))
  }, [])

  const quickVerify = async (id: string) => {
    await fetch(`/api/admin/payments/${id}/verify`, { method: 'POST' })
    // Refresh
    const res = await fetch('/api/admin/dashboard')
    setData(await res.json())
  }

  return (
    <div>
      <AdminTopbar title="Dashboard" description="Selamat datang, Bendahara" />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : data ? (
          <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Total Saldo" value={data.stats.totalBalance} icon={Wallet} formatAsCurrency accentColor="emerald" />
            <StatCard label="Pemasukan" value={data.stats.incomeThisMonth} icon={TrendingUp} formatAsCurrency accentColor="emerald" />
            <StatCard label="Pengeluaran" value={data.stats.expenseThisMonth} icon={TrendingDown} formatAsCurrency accentColor="danger" />
            <StatCard label="Lunas" value={data.stats.paidCount} suffix={`/${data.stats.totalBilledCount}`} icon={CheckCircle} accentColor="emerald" />
            <StatCard label="Menunggak" value={data.stats.overdueCount} icon={AlertTriangle} accentColor="danger" />
            <StatCard label="Anggota Aktif" value={data.stats.activeMembers} icon={Users} accentColor="info" />
          </motion.div>
        ) : null}

        {/* Two columns: Chart + Overdue */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <motion.div {...fadeUp} className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Pemasukan vs Pengeluaran</h3>
            {data?.chartData ? <MonthlyChart data={data.chartData} /> : <div className="h-[300px] skeleton rounded-lg" />}
          </motion.div>

          {/* Overdue */}
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">Menunggak Bulan Ini</h3>
            </div>
            <div className="max-h-[340px] overflow-auto">
              {data?.overdueMembers && data.overdueMembers.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Tagihan</th>
                      <th>Jumlah</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.overdueMembers.map(om => (
                      <tr key={om.id}>
                        <td className="font-medium text-text-primary">{om.member.name}</td>
                        <td>{om.billing.title}</td>
                        <td className="font-mono-num">{formatRupiah(Number(om.billing.amount))}</td>
                        <td>
                          <button onClick={() => quickVerify(om.id)} className="btn btn-primary btn-sm">Tandai Lunas</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-text-tertiary">Tidak ada tunggakan</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div {...fadeUp}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/admin/anggota', icon: Plus, label: 'Tambah Anggota', color: 'text-emerald-bright' },
              { href: '/admin/tagihan', icon: Receipt, label: 'Buat Tagihan', color: 'text-gold-bright' },
              { href: '/admin/pengeluaran', icon: ArrowDownCircle, label: 'Catat Pengeluaran', color: 'text-danger' },
              { href: '/admin/pengumuman', icon: Megaphone, label: 'Buat Pengumuman', color: 'text-info' },
            ].map(action => (
              <Link key={action.href} href={action.href} className="card p-4 flex items-center gap-3 hover:border-border-default transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center group-hover:border-border-default transition-colors">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{action.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        {data?.recentTransactions && data.recentTransactions.length > 0 && (
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">Aktivitas Terbaru</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Keterangan</th>
                    <th>Dana</th>
                    <th className="text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.slice(0, 10).map(tx => (
                    <tr key={tx.id}>
                      <td className="font-medium text-text-primary">{tx.title}</td>
                      <td>{tx.fundName}</td>
                      <td className={`text-right font-mono-num ${tx.type === 'income' ? 'text-emerald-bright' : 'text-danger'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
