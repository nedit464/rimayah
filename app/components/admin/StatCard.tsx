'use client'

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { useCounterAnimation } from '@/hooks/use-counter-animation'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  accentColor?: 'emerald' | 'gold' | 'danger' | 'info'
  formatAsCurrency?: boolean
}

const accentColors = {
  emerald: 'bg-emerald-subtle text-emerald-bright border-emerald-dim',
  gold: 'bg-gold-subtle text-gold-bright border-gold-muted',
  danger: 'bg-danger-muted text-danger border-red-900/40',
  info: 'bg-info-muted text-info border-blue-900/40',
}

export function StatCard({ label, value, prefix, suffix, icon: Icon, trend, accentColor = 'emerald', formatAsCurrency }: StatCardProps) {
  const animatedValue = useCounterAnimation(value)

  const displayValue = formatAsCurrency
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(animatedValue)
    : `${prefix ?? ''}${animatedValue.toLocaleString('id-ID')}${suffix ?? ''}`

  return (
    <motion.div {...fadeUp} className="card-featured p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center', accentColors[accentColor])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-mono-num text-2xl font-bold text-text-primary">
        {displayValue}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className={cn('text-xs font-medium', trend.value >= 0 ? 'text-emerald-bright' : 'text-danger')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-text-disabled">{trend.label}</span>
        </div>
      )}
    </motion.div>
  )
}
