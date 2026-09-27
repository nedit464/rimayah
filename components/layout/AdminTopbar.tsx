'use client'

import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { ThemeToggle } from './ThemeToggle'

interface AdminTopbarProps {
  title: string
  description?: string
}

export function AdminTopbar({ title, description }: AdminTopbarProps) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="h-16 border-b border-border-subtle bg-surface-1/80 backdrop-blur-sm flex items-center px-6 gap-4">
      <button
        onClick={toggleSidebar}
        className="btn-icon btn-ghost lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {description && <p className="text-xs text-text-tertiary">{description}</p>}
      </div>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
