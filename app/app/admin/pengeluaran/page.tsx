'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ArrowUpCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { fadeUp, scaleIn } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface Fund {
  id: string
  name: string
}

interface Expense {
  id: string
  title: string
  amount: number
  category: keyof typeof EXPENSE_CATEGORIES
  date: string
  fundId: string
  fund: { name: string }
  description: string | null
}

const emptyForm = {
  title: '',
  amount: '',
  category: 'OPERASIONAL' as keyof typeof EXPENSE_CATEGORIES,
  fundId: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
}

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(emptyForm)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resExpenses, resFunds] = await Promise.all([
        fetch('/api/admin/expenses'),
        fetch('/api/admin/funds'),
      ])
      setExpenses(await resExpenses.json())
      setFunds(await resFunds.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setEditTarget(null)
    setFormData(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (e: Expense) => {
    setEditTarget(e)
    setFormData({
      title: e.title,
      amount: String(e.amount),
      category: e.category,
      fundId: e.fundId,
      date: e.date.split('T')[0],
      description: e.description ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.fundId || !formData.date) {
      setError('Semua field bertanda * wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      }

      const res = editTarget
        ? await fetch(`/api/admin/expenses/${editTarget.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (res.ok) {
        setModalOpen(false)
        setEditTarget(null)
        setFormData(emptyForm)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menyimpan pengeluaran')
      }
    } catch {
      setError('Terjadi kesalahan server')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/expenses/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteTarget(null)
        fetchData()
      }
    } catch {}
    setDeleting(false)
  }

  return (
    <div>
      <AdminTopbar title="Catat Pengeluaran" description="Kelola pengeluaran dan belanja dana kas organisasi" />

      <div className="p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex justify-end mb-6 w-full sm:w-auto">
          <button onClick={openAdd} className="btn btn-primary w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Catat Pengeluaran
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton />
        ) : expenses.length === 0 ? (
          <EmptyState title="Belum ada pengeluaran" description="Catat pengeluaran baru untuk melihat mutasi dana kas." />
        ) : (
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pengeluaran</th>
                    <th>Kategori</th>
                    <th>Diambil Dari</th>
                    <th className="text-right">Nominal</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td className="font-mono-num text-xs">{formatDateShort(e.date)}</td>
                      <td className="font-medium text-text-primary">
                        <div>{e.title}</div>
                        {e.description && (
                          <div className="text-xs text-text-tertiary font-normal mt-0.5">{e.description}</div>
                        )}
                      </td>
                      <td>
                        <span className="text-xs px-2.5 py-1 rounded bg-surface-2 border border-border-subtle font-medium text-text-secondary">
                          {EXPENSE_CATEGORIES[e.category]}
                        </span>
                      </td>
                      <td>{e.fund.name}</td>
                      <td className="text-right font-mono-num font-semibold text-danger">
                        -{formatRupiah(Number(e.amount))}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(e)}
                            title="Edit"
                            className="btn btn-ghost btn-icon w-8 h-8 text-text-tertiary hover:text-emerald-bright hover:bg-emerald-dim transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            title="Hapus"
                            className="btn btn-ghost btn-icon w-8 h-8 text-text-tertiary hover:text-danger hover:bg-danger-muted transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setModalOpen(false)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-danger" />
                  <h3 className="text-lg font-semibold text-text-primary">
                    {editTarget ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Nama Pengeluaran *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input text-sm"
                    placeholder="Contoh: Beli Pelana Baru"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nominal (Rupiah) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="input font-mono-num text-sm"
                      placeholder="Nominal"
                    />
                  </div>
                  <div>
                    <label className="label">Tanggal *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kategori *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof EXPENSE_CATEGORIES })}
                      className="input text-sm"
                    >
                      {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ambil Dari Dana *</label>
                    <select
                      value={formData.fundId}
                      onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                      className="input text-sm"
                    >
                      <option value="">Pilih Dana</option>
                      {funds.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Keterangan (Opsional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input py-2 min-h-[80px]"
                    placeholder="Tulis rincian..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="btn btn-secondary" disabled={saving}>Batal</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setDeleteTarget(null)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-danger-muted flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Hapus Pengeluaran?</h3>
                  <p className="text-sm text-text-tertiary mt-0.5">Saldo dana akan dikembalikan secara otomatis.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle mb-5">
                <p className="font-medium text-text-primary text-sm">{deleteTarget.title}</p>
                <p className="text-danger font-mono-num text-sm mt-0.5">-{formatRupiah(Number(deleteTarget.amount))}</p>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary" disabled={deleting}>Batal</button>
                <button onClick={handleDelete} className="btn bg-red-900/80 border border-red-700/60 text-danger hover:bg-red-900" disabled={deleting}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
