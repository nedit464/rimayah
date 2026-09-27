'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { AdminTopbar } from '@/components/layout/AdminTopbar'
import { fadeUp } from '@/lib/animations'

export default function PengaturanPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    org_name: "Sa'ad Al-Furusiyah",
    whatsapp_number: '',
    monthly_kas_amount: '8000',
    default_due_day: '10',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }))
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsSuccess(false)
    setSettingsError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSettingsSuccess(true)
      } else {
        setSettingsError('Gagal menyimpan pengaturan')
      }
    } catch {
      setSettingsError('Terjadi kesalahan jaringan')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok')
      return
    }
    setSavingPassword(true)
    setPasswordSuccess(false)
    setPasswordError('')
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordSuccess(true)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordError(data.error || 'Gagal mengganti password')
      }
    } catch {
      setPasswordError('Terjadi kesalahan jaringan')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div>
      <AdminTopbar title="Pengaturan" description="Kelola pengaturan sistem dan keamanan akun" />

      <div className="p-6 lg:p-8 grid md:grid-cols-2 gap-8">
        {/* Settings Form */}
        <motion.div {...fadeUp} className="card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
            <Settings className="w-5 h-5 text-emerald-bright" />
            <h3 className="text-base font-semibold text-text-primary">Pengaturan Organisasi</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsError && (
              <div className="p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="p-3 rounded-lg bg-emerald-subtle/20 border border-emerald-950/40 text-emerald-bright text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Pengaturan berhasil disimpan!
              </div>
            )}

            <div>
              <label className="label">Nama Organisasi</label>
              <input
                type="text"
                value={settings.org_name}
                onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
                className="input text-sm"
                required
              />
            </div>

            <div>
              <label className="label">Nomor WhatsApp Bendahara (Kode Negara, e.g. 62812345678)</label>
              <input
                type="text"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="input text-sm"
                placeholder="628..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Jumlah Kas Bulanan (Rp)</label>
                <input
                  type="number"
                  value={settings.monthly_kas_amount}
                  onChange={(e) => setSettings({ ...settings, monthly_kas_amount: e.target.value })}
                  className="input font-mono-num text-sm"
                  required
                />
              </div>
              <div>
                <label className="label">Batas Hari Jatuh Tempo (Tanggal)</label>
                <input
                  type="number"
                  value={settings.default_due_day}
                  onChange={(e) => setSettings({ ...settings, default_due_day: e.target.value })}
                  className="input font-mono-num text-sm"
                  min="1"
                  max="31"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={savingSettings}>
              {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </form>
        </motion.div>

        {/* Change Password Form */}
        <motion.div {...fadeUp} className="card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
            <Lock className="w-5 h-5 text-emerald-bright" />
            <h3 className="text-base font-semibold text-text-primary">Keamanan Akun</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-lg bg-danger-muted border border-red-900/40 text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-subtle/20 border border-emerald-950/40 text-emerald-bright text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Password berhasil diubah!
              </div>
            )}

            <div>
              <label className="label">Password Saat Ini</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input text-sm"
                required
              />
            </div>

            <div>
              <label className="label">Password Baru</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input text-sm"
                required
              />
            </div>

            <div>
              <label className="label">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input text-sm"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={savingPassword}>
              {savingPassword ? 'Memproses...' : 'Ubah Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
