'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pencil, Trash2, Pin, Eye, EyeOff } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { fadeUp, scaleIn } from '@/lib/animations'
import { formatDate } from '@/lib/utils'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'FINANCE_NOTICE' | 'PAYMENT_REMINDER' | 'ORGANIZATION_UPDATE'
  isPinned: boolean
  publishedAt: string
  isVisible: boolean
}

export default function PengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'FINANCE_NOTICE' as Announcement['type'],
    isPinned: false,
    isVisible: true,
  })

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const openAdd = () => {
    setEditingAnn(null)
    setFormData({ title: '', content: '', type: 'FINANCE_NOTICE', isPinned: false, isVisible: true })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditingAnn(a)
    setFormData({
      title: a.title,
      content: a.content,
      type: a.type,
      isPinned: a.isPinned,
      isVisible: a.isVisible,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      setError('Judul dan Konten wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingAnn ? `/api/admin/announcements/${editingAnn.id}` : '/api/admin/announcements'
      const method = editingAnn ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setModalOpen(false)
        fetchAnnouncements()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menyimpan pengumuman')
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
      const res = await fetch(`/api/admin/announcements/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchAnnouncements()
      }
    } catch {}
  }

  return (
    <div>
      <AdminTopbar title="Pengumuman" description="Kelola pengumuman untuk halaman utama organisasi" />

      <div className="p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex justify-end mb-6 w-full sm:w-auto">
          <button onClick={openAdd} className="btn btn-primary w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Tambah Pengumuman
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton />
        ) : announcements.length === 0 ? (
          <EmptyState title="Belum ada pengumuman" description="Buat pengumuman pertama Anda." />
        ) : (
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Tipe</th>
                    <th>Tanggal Rilis</th>
                    <th>Pin</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map(ann => (
                    <tr key={ann.id}>
                      <td className="font-medium text-text-primary max-w-xs truncate">
                        {ann.title}
                      </td>
                      <td><StatusBadge status={ann.type} /></td>
                      <td className="font-mono-num text-xs">{formatDate(ann.publishedAt)}</td>
                      <td>
                        {ann.isPinned ? (
                          <Pin className="w-4 h-4 text-gold-bright" />
                        ) : (
                          <span className="text-text-disabled">—</span>
                        )}
                      </td>
                      <td>
                        {ann.isVisible ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-bright font-medium">
                            <Eye className="w-3.5 h-3.5" /> Publik
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-text-tertiary font-medium">
                            <EyeOff className="w-3.5 h-3.5" /> Draf
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(ann)} className="btn btn-ghost btn-icon" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(ann.id)} className="btn btn-ghost btn-icon text-danger" title="Hapus">
                            <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setModalOpen(false)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-xl mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editingAnn ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
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
                  <label className="label">Judul Pengumuman *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input text-sm"
                    placeholder="Judul pengumuman..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Tipe Pengumuman *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Announcement['type'] })}
                      className="input text-sm"
                    >
                      <option value="FINANCE_NOTICE">Pemberitahuan Keuangan</option>
                      <option value="PAYMENT_REMINDER">Pengingat Pembayaran</option>
                      <option value="ORGANIZATION_UPDATE">Update Organisasi</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-6 pb-2.5">
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.isPinned}
                        onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                        className="rounded border-border-subtle text-emerald-bright focus:ring-emerald-bright/20 bg-surface-base w-4 h-4"
                      />
                      Sematkan (Pin)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.isVisible}
                        onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                        className="rounded border-border-subtle text-emerald-bright focus:ring-emerald-bright/20 bg-surface-base w-4 h-4"
                      />
                      Terbitkan Ke Publik
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Konten Pengumuman *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input py-2 min-h-[160px] text-sm"
                    placeholder="Tulis konten pengumuman di sini..."
                  />
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
        title="Hapus Pengumuman?"
        description="Tindakan ini akan menghapus pengumuman secara permanen dari portal keuangan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  )
}
