export const MONTHLY_KAS_AMOUNT = 8000
export const DEFAULT_DUE_DAY = 10
export const MIN_JOIN_DATE = new Date('2025-12-01')
export const SESSION_EXPIRY_HOURS = 24
export const ITEMS_PER_PAGE = 10
export const SEARCH_DEBOUNCE_MS = 300

export const EXPENSE_CATEGORIES = {
  PERALATAN: 'Peralatan',
  KONSUMSI: 'Konsumsi',
  EVENT: 'Event',
  OPERASIONAL: 'Operasional',
  TRANSPORTASI: 'Transportasi',
  LAINNYA: 'Lainnya',
} as const

export const PAYMENT_STATUS_LABELS = {
  BELUM_BAYAR: 'Belum Bayar',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  MENUNGGAK: 'Menunggak',
  LUNAS: 'Lunas',
} as const

export const ANNOUNCEMENT_TYPE_LABELS = {
  FINANCE_NOTICE: 'Pemberitahuan Keuangan',
  PAYMENT_REMINDER: 'Pengingat Pembayaran',
  ORGANIZATION_UPDATE: 'Update Organisasi',
} as const

export const BILLING_TYPE_LABELS = {
  MONTHLY_KAS: 'Iuran Bulanan',
  CUSTOM: 'Tagihan Khusus',
} as const
