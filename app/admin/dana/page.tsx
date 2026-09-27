'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pencil, Trash2, Wallet } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { fadeUp, scaleIn } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'

interface Fund {
  id: string
  name: string
  balance: number
  color: string | null
  description: string | null
}

export default function DanaPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFund, setEditingFund] = useState<Fund | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#059669',
  })

  const fetchFunds = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/funds')
      const data = await res.json()
      setFunds(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchFunds()
  }, [])

  const openAdd = () => {
    setEditingFund(null)
    setFormData({ name: '', description: '', color: '#059669' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (f: Fund) => {
    setEditingFund(f)
    setFormData({
      name: f.name,
      description: f.description || '',
      color: f.color || '#059669',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      setError('Nama Pos Dana wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingFund ? `/api/admin/funds/${editingFund.id}` : '/api/admin/funds'
      const method = editingFund ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setModalOpen(false)
        fetchFunds()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menyimpan pos dana')
      }
    } catch {
      setError('Terjadi kesalahan server')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/funds/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchFunds()
      }
    } catch {}
  }

  return (
    <div>
      <AdminTopbar title="Pos Dana" description="Kelola alokasi pos anggaran organisasi" />

      <div className="p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex justify-end mb-6 w-full sm:w-auto">
          <button onClick={openAdd} className="btn btn-primary w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Tambah Pos Dana
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : funds.length === 0 ? (
          <EmptyState title="Belum ada pos dana" description="Tambahkan pos dana untuk melacak alokasi uang kas." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funds.map(fund => (
              <motion.div key={fund.id} {...fadeUp} className="card p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                {/* Visual color bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: fund.color || '#059669' }}
                />

                <div className="pl-2 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{fund.name}</h3>
                      <p className="text-xs text-text-tertiary mt-1 leading-relaxed line-clamp-2">
                        {fund.description || 'Tidak ada deskripsi.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(fund)} className="btn btn-ghost btn-icon" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(fund.id)} className="btn btn-ghost btn-icon text-danger" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-bright" />
                    <span className="font-mono-num text-xl font-bold text-text-primary">
                      {formatRupiah(Number(fund.balance))}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setModalOpen(false)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editingFund ? 'Edit Pos Dana' : 'Tambah Pos Dana'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Nama Pos Dana *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input text-sm"
                    placeholder="Contoh: Kas Utama, Dana Event"
                  />
                </div>
                <div>
                  <label className="label">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input py-2 min-h-[80px]"
                    placeholder="Tulis deskripsi pos dana..."
                  />
                </div>
                <div>
                  <label className="label">Warna Aksen</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded border border-border-subtle cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input w-28 font-mono-num text-sm"
                      placeholder="#059669"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="btn btn-secondary" disabled={saving}>Batal</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Pos Dana?"
        description="Pastikan saldo pos dana ini bernilai 0 sebelum menghapusnya. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  )
}
