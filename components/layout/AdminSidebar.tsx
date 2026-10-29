'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Megaphone,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/anggota', label: 'Anggota', icon: Users },
  { href: '/admin/tagihan', label: 'Tagihan', icon: Receipt },
  { href: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/dana', label: 'Dana & Saldo', icon: Wallet },
  { href: '/admin/pemasukan', label: 'Pemasukan', icon: ArrowUpCircle },
  { href: '/admin/pengeluaran', label: 'Pengeluaran', icon: ArrowDownCircle },
  { href: '/admin/transparansi', label: 'Transparansi', icon: Eye },
  { href: '/admin/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <motion.aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen flex flex-col',
          'bg-surface-1 border-r border-border-subtle',
          'transition-all duration-200 ease-out',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
          !sidebarOpen && 'overflow-hidden lg:overflow-visible'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="brand-logo-frame w-9 h-9 flex-shrink-0">
                <Image
                  src="/rimayah-logo.jpg"
                  alt="Logo Sa'ad Al-Furusiyah"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-heading text-sm text-text-primary truncate">Sa&apos;ad Al-Furusiyah</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="btn-icon btn-ghost flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-subtle text-emerald-bright'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {isActive && sidebarOpen && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-[3px] h-6 rounded-r bg-emerald-base"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle p-3 space-y-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full',
              'text-text-tertiary hover:text-danger hover:bg-danger-muted transition-all'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </button>
          {sidebarOpen && (
            <p className="text-[10px] text-text-disabled text-center px-2">
              Dikembangkan oleh PT FIHLA INOVASI UTAMA
            </p>
          )}
        </div>
      </motion.aside>
    </>
  )
}
