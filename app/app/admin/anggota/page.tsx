'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { fadeUp, scaleIn } from '@/lib/animations'
import { formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

interface Member {
  id: string
  name: string
  joinDate: string
  status: 'AKTIF' | 'NONAKTIF'
  role: 'MUASSIS' | 'ANGGOTA'
  memberBillings: { status: string }[]
}

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MUASSIS' | 'ANGGOTA'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', joinDate: '', status: 'AKTIF', role: 'ANGGOTA' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/members')
      const data = await res.json()
      if (data.error) {
        console.error('API Error:', data.error)
        setMembers([])
      } else {
        setMembers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Fetch Error:', err)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter
    const matchRole = roleFilter === 'ALL' || m.role === roleFilter
    return matchSearch && matchStatus && matchRole
  })

  const openAdd = () => {
    setEditingMember(null)
    setFormData({ name: '', joinDate: '', status: 'AKTIF', role: 'ANGGOTA' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (m: Member) => {
    setEditingMember(m)
    setFormData({ name: m.name, joinDate: m.joinDate.split('T')[0], status: m.status, role: m.role })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.joinDate) {
      setFormError('Semua field wajib diisi')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const url = editingMember ? `/api/admin/members/${editingMember.id}` : '/api/admin/members'
      const method = editingMember ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, joinDate: new Date(formData.joinDate) })
      })
      if (res.ok) {
        setModalOpen(false)
        fetchMembers()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Gagal menyimpan')
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/admin/members/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchMembers()
  }

  return (
    <div>
      <AdminTopbar title="Anggota" description="Kelola data anggota organisasi" />

      <div className="p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari anggota..." className="w-full sm:w-64" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'AKTIF' | 'NONAKTIF')}
              className="input w-full sm:w-auto text-sm"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'MUASSIS' | 'ANGGOTA')}
              className="input w-full sm:w-auto text-sm"
            >
              <option value="ALL">Semua Role</option>
              <option value="MUASSIS">Muassis</option>
              <option value="ANGGOTA">Anggota</option>
            </select>
          </div>
          <button onClick={openAdd} className="btn btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Tambah Anggota
          </button>
        </div>

        {/* Table */}
        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <EmptyState title="Belum ada anggota" description="Tambahkan anggota baru untuk memulai." />
        ) : (
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama</th>
                    <th>Tanggal Bergabung</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Tagihan</th>
                    <th>Lunas</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const totalBills = m.memberBillings.length
                    const paidBills = m.memberBillings.filter(mb => mb.status === 'LUNAS').length
                    return (
                      <tr key={m.id}>
                        <td className="font-mono-num text-xs text-text-tertiary">{i + 1}</td>
                        <td className="font-medium text-text-primary">{m.name}</td>
                        <td className="font-mono-num text-xs">{formatDate(m.joinDate)}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            m.role === 'MUASSIS'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            {m.role === 'MUASSIS' ? 'Muassis' : 'Anggota'}
                          </span>
                        </td>
                        <td><StatusBadge status={m.status} /></td>
                        <td className="font-mono-num">{totalBills}</td>
                        <td className="font-mono-num">{paidBills}/{totalBills}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(m)} className="btn btn-ghost btn-icon" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteId(m.id)} className="btn btn-ghost btn-icon text-danger" title="Hapus">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editingMember ? 'Edit Anggota' : 'Tambah Anggota'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{formError}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Nama Lengkap</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" placeholder="Nama anggota" />
                </div>
                <div>
                  <label className="label">Tanggal Bergabung</label>
                  <input type="date" value={formData.joinDate} onChange={(e) => setFormData({...formData, joinDate: e.target.value})} className="input" min="2025-12-01" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input">
                      <option value="AKTIF">Aktif</option>
                      <option value="NONAKTIF">Nonaktif</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="input">
                      <option value="ANGGOTA">Anggota</option>
                      <option value="MUASSIS">Muassis</option>
                    </select>
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

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Anggota?"
        description="Semua data tagihan anggota ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  )
}
