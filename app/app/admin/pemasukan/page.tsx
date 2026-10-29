'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ArrowUpCircle, Pencil, Trash2, AlertTriangle, Wallet } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { fadeUp, scaleIn } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

interface Fund {
  id: string
  name: string
  color?: string | null
}

interface Income {
  id: string
  title: string
  amount: number
  date: string
  fundId: string
  fund: { id: string; name: string; color?: string | null }
  description: string | null
}

const emptyForm = {
  title: '',
  amount: '',
  fundId: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
}

export default function PemasukanPage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Income | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const [selectedFundFilter, setSelectedFundFilter] = useState<string>('ALL')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resIncomes, resFunds] = await Promise.all([
        fetch('/api/admin/incomes'),
        fetch('/api/admin/funds'),
      ])
      if (resIncomes.ok) {
        const data = await resIncomes.json()
        setIncomes(Array.isArray(data) ? data : [])
      }
      if (resFunds.ok) {
        const data = await resFunds.json()
        setFunds(Array.isArray(data) ? data : [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAdd = () => {
    setEditTarget(null)
    setFormData({
      ...emptyForm,
      fundId: funds[0]?.id || '',
    })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (inc: Income) => {
    setEditTarget(inc)
    setFormData({
      title: inc.title,
      amount: String(inc.amount),
      fundId: inc.fundId,
      date: inc.date.split('T')[0],
      description: inc.description ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.fundId || !formData.date) {
      setError('Semua field bertanda * wajib diisi')
      return
    }
    const amountNum = parseFloat(formData.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Jumlah pemasukan harus lebih besar dari 0')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        title: formData.title,
        amount: amountNum,
        fundId: formData.fundId,
        date: new Date(formData.date),
        description: formData.description || undefined,
      }

      const res = editTarget
        ? await fetch(`/api/admin/incomes/${editTarget.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/incomes', {
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
        setError(data.error || 'Gagal menyimpan pemasukan')
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
      const res = await fetch(`/api/admin/incomes/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteTarget(null)
        fetchData()
      }
    } catch {}
    setDeleting(false)
  }

  const filteredIncomes = selectedFundFilter === 'ALL'
    ? incomes
    : incomes.filter(inc => inc.fundId === selectedFundFilter)

  const totalFilteredIncome = filteredIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0)

  return (
    <div>
      <AdminTopbar
        title="Catat Pemasukan"
        description="Kelola pemasukan kustom di luar iuran/tagihan anggota (donasi, sponsor, dll.)"
      />

      <div className="p-6 lg:p-8">
        {/* Top Summary & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="card p-3 px-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-subtle flex items-center justify-center text-emerald-bright">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Total Pemasukan Kustom</p>
                <p className="font-mono-num text-base font-bold text-emerald-bright">
                  {formatRupiah(totalFilteredIncome)}
                </p>
              </div>
            </div>

            {/* Filter by Pos Dana */}
            {funds.length > 0 && (
              <select
                value={selectedFundFilter}
                onChange={(e) => setSelectedFundFilter(e.target.value)}
                className="input py-2 text-sm w-auto max-w-[200px]"
              >
                <option value="ALL">Semua Pos Dana</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button onClick={openAdd} className="btn btn-primary w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Catat Pemasukan
          </button>
        </div>

        {/* Incomes Table */}
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filteredIncomes.length === 0 ? (
          <EmptyState
            icon={<ArrowUpCircle className="w-8 h-8 text-text-tertiary" />}
            title="Belum ada data pemasukan kustom"
            description="Pemasukan kustom di luar tagihan (seperti hibah atau donasi) akan tercatat di sini."
            action={
              <button onClick={openAdd} className="btn btn-primary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Catat Pemasukan
              </button>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Judul / Sumber</th>
                    <th>Jumlah</th>
                    <th>Pos Dana</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((inc) => (
                    <tr key={inc.id}>
                      <td className="font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="w-4 h-4 text-emerald-bright shrink-0" />
                          <span>{inc.title}</span>
                        </div>
                      </td>
                      <td className="font-mono-num font-semibold text-emerald-bright">
                        +{formatRupiah(Number(inc.amount))}
                      </td>
                      <td>
                        <span className="badge badge-emerald">
                          {inc.fund?.name || 'Kas'}
                        </span>
                      </td>
                      <td className="text-text-secondary">{formatDateShort(inc.date)}</td>
                      <td className="text-text-tertiary max-w-[220px] truncate">
                        {inc.description || '-'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(inc)}
                            className="btn-icon btn-ghost"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(inc)}
                            className="btn-icon btn-ghost text-danger hover:bg-danger-muted"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Catat / Edit Pemasukan */}
        <AnimatePresence>
          {modalOpen && (
            <div className="modal-backdrop">
              <motion.div {...scaleIn} className="modal-box max-w-md">
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                  <h3 className="font-heading text-lg text-text-primary">
                    {editTarget ? 'Edit Pemasukan Kustom' : 'Catat Pemasukan Kustom'}
                  </h3>
                  <button onClick={() => setModalOpen(false)} className="btn-icon btn-ghost">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-danger-muted border border-danger/20 text-xs text-danger">
                    {error}
                  </div>
                )}

                <div className="py-4 space-y-4">
                  <div>
                    <label className="label">Judul / Sumber Pemasukan *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Donasi dari Hamba Allah, Hibah Peralatan, dll."
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Jumlah (Rp) *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="input font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="label">Masuk ke Pos Dana *</label>
                    <select
                      value={formData.fundId}
                      onChange={(e) => setFormData(prev => ({ ...prev, fundId: e.target.value }))}
                      className="input"
                    >
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Tanggal Pemasukan *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Keterangan (Opsional)</label>
                    <textarea
                      rows={2}
                      placeholder="Catatan tambahan mengenai pemasukan ini..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="input py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="btn btn-ghost"
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Catat Pemasukan'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Konfirmasi Hapus */}
        <AnimatePresence>
          {deleteTarget && (
            <div className="modal-backdrop">
              <motion.div {...scaleIn} className="modal-box max-w-sm">
                <div className="flex items-center gap-3 text-danger mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-heading text-lg">Hapus Pemasukan?</h3>
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  Pemasukan <strong className="text-text-primary">&ldquo;{deleteTarget.title}&rdquo;</strong> sebesar{' '}
                  <span className="font-semibold text-emerald-bright font-mono-num">
                    {formatRupiah(Number(deleteTarget.amount))}
                  </span>{' '}
                  akan dihapus.
                </p>
                <p className="text-xs text-text-tertiary mb-6">
                  Saldo pada pos dana terkait akan otomatis dikurangi kembali sesuai nominal ini.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="btn btn-ghost"
                    disabled={deleting}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger"
                    disabled={deleting}
                  >
                    {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
