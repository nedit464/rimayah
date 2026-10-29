'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Calendar, Receipt } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { fadeUp, scaleIn } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort, getMonthName } from '@/lib/utils'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

interface Fund {
  id: string
  name: string
}

interface Member {
  id: string
  name: string
}

interface Billing {
  id: string
  title: string
  type: 'MONTHLY_KAS' | 'CUSTOM'
  amount: number
  dueDate: string
  validUntil?: string | null
  isExpired?: boolean
  month: number | null
  year: number | null
  fund: { id: string; name: string }
  memberBillings: { status: string }[]
  roles: string[]
}

export default function TagihanPage() {
  const [billings, setBillings] = useState<Billing[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'MONTHLY' | 'CUSTOM'>('MONTHLY')

  // Modals
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)

  // Forms
  const [monthlyForm, setMonthlyForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '', // optional override amount in IDR
    roles: [] as string[] // selected roles for billing
  })
  const [customForm, setCustomForm] = useState({
    title: '',
    amount: '',
    dueDate: '',
    validUntil: '',
    fundId: '',
    description: '',
    roles: [] as string[]
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Edit / Delete
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<{ id: string; title: string; amount: string; dueDate: string; validUntil?: string; fundId: string; description?: string; roles: string[] } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resBillings, resFunds, resMembers] = await Promise.all([
        fetch('/api/admin/billings'),
        fetch('/api/admin/funds'),
        fetch('/api/admin/members'),
      ])

      // billings
      if (resBillings.ok) {
        const data = await resBillings.json()
        setBillings(Array.isArray(data) ? data : [])
      } else {
        try {
          const err = await resBillings.json()
          setError(err?.error || 'Gagal memuat tagihan')
        } catch {
          setError('Gagal memuat tagihan')
        }
        setBillings([])
      }

      // funds
      if (resFunds.ok) {
        const data = await resFunds.json()
        setFunds(Array.isArray(data) ? data : [])
      } else {
        setFunds([])
      }

      // members
      if (resMembers.ok) {
        const data = await resMembers.json()
        setMembers(Array.isArray(data) ? data : [])
      } else {
        setMembers([])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredBillings = billings.filter(b => {
    if (activeTab === 'MONTHLY') return b.type === 'MONTHLY_KAS'
    return b.type === 'CUSTOM'
  })

  const handleGenerateMonthly = async () => {
    setSaving(true)
    setError('')
    try {
      // Prepare payload with optional fields
      const payload: any = {
        month: monthlyForm.month,
        year: monthlyForm.year
      }
      if (monthlyForm.amount && monthlyForm.amount.trim() !== '') {
        payload.amount = parseFloat(monthlyForm.amount)
      }
      if (monthlyForm.roles && monthlyForm.roles.length > 0) {
        payload.roles = monthlyForm.roles
      }
      const res = await fetch('/api/admin/billings/generate-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setMonthlyModalOpen(false)
        // Reset amount and roles for next use
        setMonthlyForm(prev => ({ ...prev, amount: '', roles: [] }))
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal membuat iuran bulanan')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCustom = async () => {
    if (!customForm.title || !customForm.amount || !customForm.dueDate || !customForm.fundId) {
      setError('Semua field bertanda * wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/billings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customForm,
          amount: parseFloat(customForm.amount),
          dueDate: new Date(customForm.dueDate),
          validUntil: customForm.validUntil ? new Date(customForm.validUntil) : null,
          roles: customForm.roles.length > 0 ? customForm.roles : undefined,
        }),
      })
      if (res.ok) {
        setCustomModalOpen(false)
        setCustomForm({ title: '', amount: '', dueDate: '', validUntil: '', fundId: '', description: '', roles: [] })
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal membuat tagihan')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/billings/${editForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          amount: parseFloat(editForm.amount),
          dueDate: new Date(editForm.dueDate),
          validUntil: editForm.validUntil ? new Date(editForm.validUntil) : null,
          fundId: editForm.fundId,
          description: editForm.description,
          roles: editForm.roles,
        })
      })
      if (res.ok) {
        setEditModalOpen(false)
        setEditForm(null)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menyimpan perubahan')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/billings/${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeletingId(null)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menghapus tagihan')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminTopbar title="Tagihan" description="Kelola iuran bulanan dan tagihan khusus anggota" />

      <div className="p-6 lg:p-8">
        {/* Tabs & Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex border-b border-border-subtle">
            <button
              onClick={() => setActiveTab('MONTHLY')}
              className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'MONTHLY'
                  ? 'border-emerald-bright text-emerald-bright'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Iuran Bulanan (Kas)
            </button>
            <button
              onClick={() => setActiveTab('CUSTOM')}
              className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'CUSTOM'
                  ? 'border-emerald-bright text-emerald-bright'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Tagihan Khusus
            </button>
          </div>

          <div className="w-full sm:w-auto">
            {activeTab === 'MONTHLY' ? (
              <button onClick={() => { setError(''); setMonthlyModalOpen(true) }} className="btn btn-primary w-full sm:w-auto justify-center">
                <Calendar className="w-4 h-4" /> Generate Kas Bulanan
              </button>
            ) : (
              <button onClick={() => { setError(''); setCustomModalOpen(true) }} className="btn btn-primary w-full sm:w-auto justify-center">
                <Receipt className="w-4 h-4" /> Buat Tagihan Khusus
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton />
        ) : filteredBillings.length === 0 ? (
          <EmptyState
            title="Belum ada tagihan"
            description={
              activeTab === 'MONTHLY'
                ? 'Generate iuran bulanan berkala untuk seluruh anggota.'
                : 'Buat tagihan khusus jika ada keperluan tertentu.'
            }
          />
        ) : (
          <motion.div {...fadeUp} className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Jumlah</th>
                    <th>Deadline</th>
                    <th>Masa Aktif</th>
                    <th>Pos Dana</th>
                    <th>Bulan/Tahun</th>
                    <th>Target</th>
                    <th>Penerima</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillings.map(b => (
                    <tr key={b.id}>
                      <td className="font-medium text-text-primary">{b.title}</td>
                      <td className="font-mono-num">{formatRupiah(Number(b.amount))}</td>
                      <td className="font-mono-num text-xs">{formatDateShort(b.dueDate)}</td>
                      <td className="text-xs">
                        {b.validUntil ? (
                          b.isExpired || new Date() > new Date(b.validUntil) ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-danger-muted text-danger border border-danger/20">
                              Kadaluarsa ({formatDateShort(b.validUntil)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-emerald-subtle text-emerald-bright border border-emerald-500/20">
                              s/d {formatDateShort(b.validUntil)}
                            </span>
                          )
                        ) : (
                          <span className="text-text-tertiary">Selamanya</span>
                        )}
                      </td>
                      <td>{b.fund.name}</td>
                      <td className="text-xs">
                        {b.month && b.year ? `${getMonthName(b.month)} ${b.year}` : '—'}
                      </td>
                      <td>
                        {b.roles && b.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {b.roles.map(r => (
                              <span key={r} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                r === 'MUASSIS'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}>
                                {r === 'MUASSIS' ? 'Muassis' : 'Anggota'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary">Semua</span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-text-secondary">
                          {b.memberBillings.length} Anggota
                        </span>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              setError('')
                              setEditForm({
                                id: b.id,
                                title: b.title,
                                amount: String(b.amount),
                                dueDate: b.dueDate.slice(0, 10),
                                validUntil: b.validUntil ? b.validUntil.slice(0, 10) : '',
                                fundId: b.fund?.id || '',
                                description: '',
                                roles: b.roles || []
                              })
                              setEditModalOpen(true)
                            }}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(b.id)}
                            className="btn btn-ghost btn-sm text-danger"
                          >
                            Hapus
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

      {/* Generate Monthly Modal */}
      <AnimatePresence>
        {monthlyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setMonthlyModalOpen(false)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Generate Kas Bulanan</h3>
                <button onClick={() => setMonthlyModalOpen(false)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{error}</div>
              )}

              <p className="text-sm text-text-secondary mb-4">
                Ini akan membuat tagihan iuran bulanan (Rp 8.000) untuk seluruh anggota aktif pada bulan terpilih.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Bulan</label>
                  <select
                    value={monthlyForm.month}
                    onChange={(e) => setMonthlyForm({ ...monthlyForm, month: parseInt(e.target.value) })}
                    className="input text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tahun</label>
                  <input
                    type="number"
                    value={monthlyForm.year}
                    onChange={(e) => setMonthlyForm({ ...monthlyForm, year: parseInt(e.target.value) })}
                    className="input"
                    min="2025"
                  />
                </div>
              </div>

              {/* Optional amount override */}
              <div className="mt-4">
                <label className="label">Nominal (Rp) - Kosongkan untuk pakai default (8.000)</label>
                <input
                  type="number"
                  placeholder="Contoh: 10000"
                  value={monthlyForm.amount}
                  onChange={(e) => setMonthlyForm({ ...monthlyForm, amount: e.target.value })}
                  className="input"
                />
              </div>

              {/* Role selection */}
              <div className="mt-4">
                <label className="label">Pilih role yang akan dikenakan tagihan (kosong = semua)</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="MUASSIS"
                      checked={monthlyForm.roles.includes('MUASSIS')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setMonthlyForm(prev => ({
                          ...prev,
                          roles: checked ? [...prev.roles, 'MUASSIS'] : prev.roles.filter(r => r !== 'MUASSIS')
                        }));
                      }}
                      className="mr-1"
                    />
                    Muassis
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="ANGGOTA"
                      checked={monthlyForm.roles.includes('ANGGOTA')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setMonthlyForm(prev => ({
                          ...prev,
                          roles: checked ? [...prev.roles, 'ANGGOTA'] : prev.roles.filter(r => r !== 'ANGGOTA')
                        }));
                      }}
                      className="mr-1"
                    />
                    Anggota
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setMonthlyModalOpen(false)} className="btn btn-secondary" disabled={saving}>Batal</button>
                <button onClick={handleGenerateMonthly} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Memproses...' : 'Generate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setEditModalOpen(false)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Edit Tagihan</h3>
                <button onClick={() => setEditModalOpen(false)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Judul</label>
                  <input className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nominal</label>
                    <input type="number" className="input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Deadline</label>
                    <input type="date" className="input" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="label">Masa Aktif Tagihan <span className="text-xs text-text-tertiary font-normal">(Opsional)</span></label>
                  <input type="date" className="input" value={editForm.validUntil || ''} onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })} />
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Jika masa aktif ditentukan dan sudah lewat, anggota tidak lagi dibebani tagihan ini. Kosongkan jika tagihan berlaku selamanya.
                  </p>
                </div>

                <div>
                  <label className="label">Pos Dana</label>
                  <select className="input text-sm" value={editForm.fundId} onChange={(e) => setEditForm({ ...editForm, fundId: e.target.value })}>
                    <option value="">Pilih Dana</option>
                    {funds.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Keterangan</label>
                  <textarea className="input py-2 min-h-[80px]" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>

                <div>
                  <label className="label">Target Role (kosong = semua anggota)</label>
                  <div className="flex gap-4 mt-2">
                    {(['MUASSIS', 'ANGGOTA'] as const).map(r => (
                      <label key={r} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.roles.includes(r)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setEditForm(prev => prev ? ({
                              ...prev,
                              roles: checked ? [...prev.roles, r] : prev.roles.filter(x => x !== r)
                            }) : prev)
                          }}
                          className="rounded"
                        />
                        <span className={`text-sm font-medium ${r === 'MUASSIS' ? 'text-amber-400' : 'text-blue-400'}`}>
                          {r === 'MUASSIS' ? 'Muassis' : 'Anggota'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">Mengubah target role akan otomatis menyesuaikan daftar anggota yang ditagih (tagihan belum lunas akan disinkronkan).</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditModalOpen(false)} className="btn btn-secondary" disabled={saving}>Batal</button>
                <button onClick={handleSaveEdit} className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setDeletingId(null)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Hapus Tagihan</h3>
                <button onClick={() => setDeletingId(null)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-text-secondary">Anda yakin ingin menghapus tagihan ini? Semua pencatatan anggota yang terkait juga akan dihapus.</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setDeletingId(null)} className="btn btn-secondary" disabled={saving}>Batal</button>
                <button onClick={handleConfirmDelete} className="btn btn-danger" disabled={saving}>{saving ? 'Menghapus...' : 'Hapus'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Custom Modal */}
      <AnimatePresence>
        {customModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="backdrop-overlay fixed inset-0" onClick={() => setCustomModalOpen(false)} />
            <motion.div {...scaleIn} className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Buat Tagihan Khusus</h3>
                <button onClick={() => setCustomModalOpen(false)} className="btn btn-ghost btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Judul Tagihan *</label>
                  <input
                    type="text"
                    value={customForm.title}
                    onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                    className="input"
                    placeholder="Contoh: Iuran Perlengkapan Archery"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nominal (Rupiah) *</label>
                    <input
                      type="number"
                      value={customForm.amount}
                      onChange={(e) => setCustomForm({ ...customForm, amount: e.target.value })}
                      className="input font-mono-num text-sm"
                      placeholder="Nominal"
                    />
                  </div>
                  <div>
                    <label className="label">Deadline *</label>
                    <input
                      type="date"
                      value={customForm.dueDate}
                      onChange={(e) => setCustomForm({ ...customForm, dueDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Masa Aktif Tagihan <span className="text-xs text-text-tertiary font-normal">(Opsional)</span></label>
                  <input
                    type="date"
                    value={customForm.validUntil}
                    onChange={(e) => setCustomForm({ ...customForm, validUntil: e.target.value })}
                    className="input"
                  />
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Jika masa aktif ditentukan dan sudah lewat, anggota tidak lagi dibebani tagihan ini. Kosongkan jika tagihan berlaku selamanya.
                  </p>
                </div>

                <div>
                  <label className="label">Tujuan Pos Dana *</label>
                  <select
                    value={customForm.fundId}
                    onChange={(e) => setCustomForm({ ...customForm, fundId: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="">Pilih Dana</option>
                    {funds.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Keterangan (Opsional)</label>
                  <textarea
                    value={customForm.description}
                    onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                    className="input py-2 min-h-[80px]"
                    placeholder="Tulis rincian..."
                  />
                </div>

                <div>
                  <label className="label">Target Role (kosong = semua anggota aktif)</label>
                  <div className="flex gap-4 mt-2">
                    {(['MUASSIS', 'ANGGOTA'] as const).map(r => (
                      <label key={r} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customForm.roles.includes(r)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setCustomForm(prev => ({
                              ...prev,
                              roles: checked ? [...prev.roles, r] : prev.roles.filter(x => x !== r)
                            }))
                          }}
                          className="rounded"
                        />
                        <span className={`text-sm font-medium ${r === 'MUASSIS' ? 'text-amber-400' : 'text-blue-400'}`}>
                          {r === 'MUASSIS' ? 'Muassis' : 'Anggota'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setCustomModalOpen(false)} className="btn btn-secondary" disabled={saving}>Batal</button>
                <button onClick={handleCreateCustom} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Buat Tagihan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
