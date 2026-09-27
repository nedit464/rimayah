'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Shield, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/cek-kas', label: 'Cek Kas' },
  { href: '/transparansi', label: 'Transparansi' },
  { href: '/pengumuman', label: 'Pengumuman' },
]

export function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle backdrop-blur-xl"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-base) 92%, transparent)' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="brand-logo-frame h-10 w-10">
              <Image
                src="/rimayah-logo.jpg"
                alt="Logo Sa'ad Al-Furusiyah"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="block font-heading text-lg text-text-primary transition-colors group-hover:text-emerald-bright">
                Sa&apos;ad Al-Furusiyah
              </span>
              <span className="hidden text-[10px] uppercase text-text-tertiary sm:block">
                Portal Keuangan
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative py-2 text-sm font-medium transition-colors duration-150',
                    pathname === link.href
                      ? 'text-text-primary after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-emerald-bright'
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link href="/login" className="btn btn-secondary btn-sm">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex h-9 w-9 items-center justify-center border border-border-default text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border-subtle bg-surface-1/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-4 py-3 text-sm font-medium rounded-lg transition-all',
                    pathname === link.href
                      ? 'text-emerald-bright bg-emerald-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-3 flex items-center gap-2 border-t border-border-subtle px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
