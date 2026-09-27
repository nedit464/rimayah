import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  className?: string
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  type?: 'income' | 'expense' | 'neutral'
}

const sizeClasses = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
}

export function CurrencyDisplay({ amount, className, size = 'base', type = 'neutral' }: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  const colorClass = type === 'income'
    ? 'text-emerald-bright'
    : type === 'expense'
      ? 'text-danger'
      : 'text-text-primary'

  return (
    <span className={cn('font-mono-num', sizeClasses[size], colorClass, className)}>
      {type === 'income' ? '+' : type === 'expense' ? '-' : ''}{formatted}
    </span>
  )
}
