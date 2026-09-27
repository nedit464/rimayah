import { Prisma } from '@prisma/client'

export function formatRupiah(amount: number | Prisma.Decimal): string {
  const num = amount instanceof Prisma.Decimal ? amount.toNumber() : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} Rb`
  return formatRupiah(amount)
}
