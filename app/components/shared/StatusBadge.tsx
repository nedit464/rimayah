'use client'

import { cn } from '@/lib/utils'

type PaymentStatusType = 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGAK' | 'LUNAS'
type MemberStatusType = 'AKTIF' | 'NONAKTIF'
type AnnouncementBadgeType = 'FINANCE_NOTICE' | 'PAYMENT_REMINDER' | 'ORGANIZATION_UPDATE'

interface StatusBadgeProps {
  status: PaymentStatusType | MemberStatusType | AnnouncementBadgeType
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  LUNAS: { label: 'Lunas', className: 'badge-lunas' },
  MENUNGGAK: { label: 'Menunggak', className: 'badge-menunggak' },
  MENUNGGU_VERIFIKASI: { label: 'Menunggu Verifikasi', className: 'badge-menunggu' },
  BELUM_BAYAR: { label: 'Belum Bayar', className: 'badge-belum' },
  AKTIF: { label: 'Aktif', className: 'badge-aktif' },
  NONAKTIF: { label: 'Nonaktif', className: 'badge-nonaktif' },
  FINANCE_NOTICE: { label: 'Keuangan', className: 'badge-finance' },
  PAYMENT_REMINDER: { label: 'Pembayaran', className: 'badge-payment' },
  ORGANIZATION_UPDATE: { label: 'Organisasi', className: 'badge-org' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: '' }
  return (
    <span className={cn('badge', config.className, className)}>
      {config.label}
    </span>
  )
}
