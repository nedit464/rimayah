'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Search, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { fadeUp } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { useDebounce } from '@/hooks/use-debounce'

interface Payment {
  id: string
  memberId: string
  billingId: string
  status: 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGAK' | 'LUNAS'
  paidAt: string | null
  verifiedAt: string | null
  notes: string | null
  member: { name: string }
  billing: { title: string; amount: number; dueDate: string }
}

export default function PembayaranPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Dialog actions
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [actioning, setActioning] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const url = activeTab === 'PENDING'
        ? '/api/admin/payments?pending=true'
        : `/api/admin/payments?search=${encodeURIComponent(debouncedSearch)}`
      const res = await fetch(url)
      const data = await res.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [activeTab, debouncedSearch])

  const handleVerify = async () => {
    if (!verifyId) return
    setActioning(true)
    try {
      const res = await fetch(`/api/admin/payments/${verifyId}/verify`, { method: 'POST' })
      if (res.ok) {
        setVerifyId(null)
        fetchPayments()
      }
    } catch {}
    setActioning(false)
  }

  const handleReject = async () => {
    if (!rejectId) return
    setActioning(true)
    try {
      const res = await fetch(`/api/admin/payments/${rejectId}/reject`, { method: 'POST' })
      if (res.ok) {
        setRejectId(null)
        fetchPayments()
      }
    } catch {}
    setActioning(false)
  }

  return (
    <div>
      <AdminTopbar title="Verifikasi Pembayaran" description="Verifikasi pembayaran iuran masuk anggota" />

      <div className="p-6 lg:p-8">
        {/* Toolbar Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex border-b border-border-subtle">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'PENDING'
                  ? 'border-emerald-bright text-emerald-bright'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Menunggu Verifikasi
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'border-emerald-bright text-emerald-bright'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Semua Tagihan
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'ALL' && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari anggota..."
                  className="input pl-10 py-1.5 text-sm"
                />
              </div>
            )}
            <button
              onClick={fetchPayments}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Info banner untuk tab pending */}
        {activeTab === 'PENDING' && !loading && (
          <div className="mb-4 p-3 bg-warning-muted border border-warning/20 rounded-lg flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-warning">
              Anggota di bawah ini telah mengklik &ldquo;Saya Sudah Bayar&rdquo; atau terdeteksi transfer. Klik <CheckCircle2 className="w-3 h-3 inline" /> untuk tandai <strong>LUNAS</strong> setelah Anda cek mutasi GoPay/BSI secara manual.
            </p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <TableSkeleton />
        ) : payments.length === 0 ? (
          <EmptyState
            title={activeTab === 'PENDING' ? 'Tidak ada yang menunggu' : 'Tidak ada data'}
            description={
              activeTab === 'PENDING'
                ? 'Belum ada anggota yang mengkonfirmasi pembayaran. Gunakan tab "Semua Tagihan" untuk cari anggota dan verifikasi manual.'
                : 'Belum ada riwayat transaksi pembayaran.'
            }
          />
        ) : (
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Anggota</th>
                    <th>Tagihan</th>
                    <th>Jumlah</th>
                    <th>Tanggal Bayar</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium text-text-primary">{p.member.name}</td>
                      <td>{p.billing.title}</td>
                      <td className="font-mono-num">{formatRupiah(Number(p.billing.amount))}</td>
                      <td className="font-mono-num text-xs">
                        {p.paidAt ? formatDateShort(p.paidAt) : '—'}
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status !== 'LUNAS' && (
                            <button
                              onClick={() => setVerifyId(p.id)}
                              className="btn btn-ghost btn-sm flex items-center gap-1 text-emerald-bright hover:bg-emerald-subtle"
                              title="Tandai Lunas"
                            >
                              <Check className="w-4 h-4" />
                              <span className="text-xs hidden sm:inline">Lunas</span>
                            </button>
                          )}
                          {p.status !== 'BELUM_BAYAR' && p.status !== 'MENUNGGAK' && (
                            <button
                              onClick={() => setRejectId(p.id)}
                              className="btn btn-ghost btn-sm flex items-center gap-1 text-danger hover:bg-danger-muted"
                              title="Tolak / Batalkan"
                            >
                              <X className="w-4 h-4" />
                              <span className="text-xs hidden sm:inline">Tolak</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Verification dialog */}
      <ConfirmDialog
        isOpen={!!verifyId}
        onClose={() => setVerifyId(null)}
        onConfirm={handleVerify}
        title="Setujui Pembayaran?"
        description="Ini akan mencatat pemasukan dan menandai tagihan anggota ini sebagai LUNAS."
        confirmLabel="Verifikasi"
        variant="default"
      />

      {/* Rejection dialog */}
      <ConfirmDialog
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={handleReject}
        title="Tolak Pembayaran?"
        description="Ini akan mengembalikan status tagihan menjadi BELUM_BAYAR atau MENUNGGAK."
        confirmLabel="Tolak"
        variant="danger"
      />
    </div>
  )
}
