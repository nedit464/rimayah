'use client'

import { AdminSidebar } from './AdminSidebar'
import { useUIStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-surface-base">
      <AdminSidebar />
      <main
        className={cn(
          'transition-all duration-200 ease-out min-h-screen',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        )}
      >
        {children}
      </main>
    </div>
  )
}
