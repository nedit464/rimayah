import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading text-text-primary">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-text-tertiary">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </div>
  )
}
