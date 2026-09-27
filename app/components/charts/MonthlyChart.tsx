'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { MonthlyChartData } from '@/types'

interface MonthlyChartProps {
  data: MonthlyChartData[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload) return null

  return (
    <div className="bg-surface-3 border border-border-default rounded-lg p-3 shadow-xl">
      <p className="text-xs text-text-tertiary mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-mono-num">
          <span className={entry.name === 'income' ? 'text-emerald-bright' : 'text-danger'}>
            {entry.name === 'income' ? 'Pemasukan' : 'Pengeluaran'}:
          </span>{' '}
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#637069' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#637069' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
        <Bar dataKey="income" name="income" fill="#059669" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  )
}
