import { cn } from '@/lib/utils'
import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-4">
        {icon ?? <InboxIcon className="w-7 h-7 text-text-tertiary" />}
      </div>
      <h3 className="text-base font-medium text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-tertiary max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
