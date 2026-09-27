'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  QrCode, 
  CreditCard, 
  Timer, 
  RefreshCw,
  Info
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils'

// Rekening Bank & QRIS Config
const BANK_ACCOUNTS = {
  BSI: {
    bankName: 'Bank Syariah Indonesia (BSI)',
    accountNumber: '7206767067',
    accountName: "Lalu Muhammad Faarih As'ad"
  }
}

interface MemberData {
  name: string
  billingTitle: string
  amount: number
  dueDate: string
  status: string
}

interface PaymentRequestData {
  id: string
  amountOriginal: number
  amountUnique: number
  amountTotal: number
  paymentMethod: 'BANK_TRANSFER' | 'QRIS'
  bankCode: string
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED'
  expiredAt: string
}

function PembayaranContent() {
  const searchParams = useSearchParams()
  const billingId = searchParams.get('billing')
  const memberId = searchParams.get('member')
  const mbId = searchParams.get('mb')

  const [memberData, setMemberData] = useState<MemberData | null>(null)
  const [activeRequest, setActiveRequest] = useState<PaymentRequestData | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'BSI' | 'QRIS' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedText, setCopiedText] = useState<'account' | 'amount' | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [pollingActive, setPollingActive] = useState(false)
  const [isLunas, setIsLunas] = useState(false)
  const [isPendingVerification, setIsPendingVerification] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // 1. Fetch data tagihan anggota
  useEffect(() => {
    if (!memberId || (!billingId && !mbId)) return
    fetch(`/api/public/members/search?q=${memberId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const member = data.find(m => m.id === memberId)
          if (member) {
            const mb = member.memberBillings.find(
              (b: { billing: { id: string }; id: string }) => b.billing.id === billingId || b.id === mbId
            )
            if (mb) {
              setMemberData({
                name: member.name,
                billingTitle: mb.billing.title,
                amount: Number(mb.billing.amount),
                dueDate: mb.billing.dueDate,
                status: mb.status
              })
              if (mb.status === 'LUNAS') {
                setIsLunas(true)
              } else if (mb.status === 'MENUNGGU_VERIFIKASI') {
                setIsPendingVerification(true)
              }
            }
          }
        }
      })
      .catch(() => {})
  }, [memberId, billingId, mbId])

  // 2. Timer hitung mundur untuk request aktif
  useEffect(() => {
    if (!activeRequest || activeRequest.status !== 'PENDING') return

    const updateTimer = () => {
      const difference = new Date(activeRequest.expiredAt).getTime() - Date.now()
      if (difference <= 0) {
        setTimeLeft('00:00')
        setActiveRequest(prev => prev ? { ...prev, status: 'EXPIRED' } : null)
        return
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)
      const hours = Math.floor((difference / 1000 / 60 / 60) % 24)

      const formattedHours = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''
      const formattedMinutes = minutes.toString().padStart(2, '0')
      const formattedSeconds = seconds.toString().padStart(2, '0')

      setTimeLeft(`${formattedHours}${formattedMinutes}:${formattedSeconds}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [activeRequest])

  // 3. Polling dinonaktifkan karena verifikasi otomatis dihapus

  // 4. Inisiasi Pembayaran (Membuat Payment Request)
  const handleInitiatePayment = async (method: 'BSI' | 'QRIS') => {
    if (!mbId) return
    setLoading(true)
    setError('')
    setSelectedMethod(method)

    try {
      const isQRIS = method === 'QRIS'
      const paymentMethod = isQRIS ? 'QRIS' : 'BANK_TRANSFER'
      const bankCode = method

      const res = await fetch('/api/public/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberBillingId: mbId,
          paymentMethod,
          bankCode
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setActiveRequest(data.data)
      } else {
        setError(data.error || 'Gagal menyiapkan instruksi pembayaran.')
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // 5. Fungsi Copy ke Clipboard
  const handleCopy = (text: string, type: 'account' | 'amount') => {
    navigator.clipboard.writeText(text)
    setCopiedText(type)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // 6. Konfirmasi Manual via Web/API (misal untuk GoPay QRIS)
  const handleConfirmManual = async () => {
    if (!mbId) return
    setConfirming(true)
    setError('')
    try {
      const res = await fetch('/api/public/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberBillingId: mbId })
      })
      if (res.ok) {
        setIsPendingVerification(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal mengirim konfirmasi pembayaran.')
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.')
    } finally {
      setConfirming(false)
    }
  }



  if (!billingId || !memberId || !mbId) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center card p-8 max-w-sm">
          <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Parameter tidak lengkap</h2>
          <p className="text-sm text-text-tertiary">Silakan akses halaman ini melalui menu Cek Kas.</p>
        </div>
      </div>
    )
  }

  // Jika tagihan sudah lunas (terdeteksi saat polling atau inisial load)
  if (isLunas) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-subtle rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-bright" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl text-text-primary">Pembayaran Sukses!</h1>
            {memberData && (
              <p className="text-text-secondary text-sm">
                Tagihan <strong>{memberData.billingTitle}</strong> atas nama <strong>{memberData.name}</strong> telah berhasil diverifikasi. Terima kasih!
              </p>
            )}
          </div>
          <div className="border border-border-default rounded-lg p-4 bg-surface-base">
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Metode Verifikasi</span>
              <span>Manual (Bendahara)</span>
            </div>
            <div className="flex justify-between text-xs text-text-tertiary mt-2">
              <span>Status Tagihan</span>
              <span className="text-emerald-bright font-bold">LUNAS</span>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/cek-kas'} 
            className="btn btn-primary w-full"
          >
            Tutup Halaman
          </button>
        </div>
      </div>
    )
  }

  // Jika tagihan menunggu verifikasi manual (diklik konfirmasi manual oleh anggota)
  if (isPendingVerification) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center space-y-6 animate-fade-in border-warning/30">
          <div className="w-16 h-16 bg-warning-muted rounded-full flex items-center justify-center mx-auto">
            <Timer className="w-10 h-10 text-warning" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl text-text-primary">Menunggu Verifikasi</h1>
            {memberData && (
              <p className="text-text-secondary text-sm leading-relaxed">
                Konfirmasi Anda untuk tagihan <strong>{memberData.billingTitle}</strong> (atas nama <strong>{memberData.name}</strong>) telah diterima. 
                Bendahara akan memverifikasi pembayaran Anda secara manual.
              </p>
            )}
          </div>
          <div className="border border-border-default rounded-lg p-4 bg-surface-base text-left">
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Metode Verifikasi</span>
              <span>Manual</span>
            </div>
            <div className="flex justify-between text-xs text-text-tertiary mt-2">
              <span>Status Tagihan</span>
              <span className="text-warning font-bold">MENUNGGU VERIFIKASI</span>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/cek-kas'} 
              className="btn btn-secondary w-full border border-border-default bg-surface-elevated hover:bg-border-subtle text-sm"
            >
              Tutup Halaman
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base py-12 md:py-16 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl text-text-primary">Metode Pembayaran</h1>
          <p className="text-text-tertiary text-sm">Rimayah Payment Gateway</p>
        </div>

        {/* Ringkasan Tagihan */}
        {memberData && (
          <div className="card p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Nama Anggota</p>
                <p className="font-bold text-text-primary text-base">{memberData.name}</p>
              </div>
              <StatusBadge status={memberData.status as any} />
            </div>
            <div className="h-px bg-border-subtle" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Tagihan</p>
                <p className="text-sm font-medium text-text-secondary">{memberData.billingTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Nominal Dasar</p>
                <p className="font-semibold text-text-primary">{formatRupiah(memberData.amount)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pemilihan Metode Bayar (Jika belum ada request aktif) */}
        {!activeRequest && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-text-secondary">Pilih Metode Pembayaran:</div>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Option BSI */}
              <button
                onClick={() => handleInitiatePayment('BSI')}
                disabled={loading}
                className="flex items-center justify-between p-4 card hover:border-emerald-bright/50 hover:bg-surface-elevated text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-subtle border border-emerald-dim flex items-center justify-center text-emerald-bright group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">Transfer BSI</div>
                    <div className="text-xs text-text-tertiary">Bank Syariah Indonesia</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-bright opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Option QRIS */}
              <button
                onClick={() => handleInitiatePayment('QRIS')}
                disabled={loading}
                className="flex items-center justify-between p-4 card hover:border-purple-500/50 hover:bg-surface-elevated text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info-muted border border-info/20 flex items-center justify-center text-info group-hover:scale-105 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">Scan QRIS</div>
                    <div className="text-xs text-text-tertiary">DANA, GoPay, OVO, ShopeePay</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-info opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-danger-muted border border-red-950/30 text-danger text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Instruksi Pembayaran Aktif */}
        {activeRequest && activeRequest.status === 'PENDING' && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Box Nominal & Timer */}
            <div className="card border-emerald-bright/30 bg-emerald-subtle p-6 text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1.5 text-xs text-emerald-bright bg-emerald-subtle px-2.5 py-1 rounded-full font-medium border border-emerald-dim">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Selesaikan dalam: {timeLeft}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">JUMLAH TRANSFER</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono text-3xl font-black text-text-primary tracking-tight">
                    {formatRupiah(activeRequest.amountTotal)}
                  </p>
                  <button
                    onClick={() => handleCopy(activeRequest.amountTotal.toString(), 'amount')}
                    className="p-1.5 text-text-tertiary hover:text-emerald-bright hover:bg-emerald-subtle rounded transition-colors"
                    title="Salin Nominal"
                  >
                    {copiedText === 'amount' ? <Check className="w-4 h-4 text-emerald-bright" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-warning-muted border border-warning/25 rounded-lg text-left flex items-start gap-2.5">
                <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-warning leading-relaxed font-medium">
                  Silakan lakukan transfer dengan nominal di atas. Setelah selesai, klik tombol <strong>&ldquo;Konfirmasi Saya Sudah Bayar&rdquo;</strong> agar bendahara dapat memverifikasi pembayaran Anda secara manual.
                </p>
              </div>
            </div>

            {/* Metode Detil: BSI */}
            {activeRequest.paymentMethod === 'BANK_TRANSFER' && (
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-bold text-text-primary">Instruksi Transfer Bank</h3>
                
                <div className="border border-border-default rounded-lg p-4 space-y-3 bg-surface-base">
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Bank Penerima</p>
                    <p className="font-bold text-text-primary text-sm">
                      {BANK_ACCOUNTS.BSI.bankName}
                    </p>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Nomor Rekening</p>
                      <p className="font-mono text-lg font-bold text-text-primary tracking-wider">
                        {BANK_ACCOUNTS.BSI.accountNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(
                        BANK_ACCOUNTS.BSI.accountNumber,
                        'account'
                      )}
                      className="btn btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs text-text-secondary border border-border-default bg-surface-elevated hover:bg-border-subtle"
                    >
                      {copiedText === 'account' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-bright" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No.Rek</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Nama Rekening</p>
                    <p className="font-bold text-text-primary text-sm">
                      {BANK_ACCOUNTS.BSI.accountName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-text-tertiary font-semibold">Langkah Transfer:</div>
                  <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1 ml-1 leading-relaxed">
                    <li>Buka aplikasi m-banking atau e-wallet Anda.</li>
                    <li>Lakukan transfer ke rekening di atas dengan nominal yang sesuai.</li>
                    <li>Setelah transfer berhasil, klik tombol <strong>&ldquo;Konfirmasi Saya Sudah Bayar&rdquo;</strong> di bawah.</li>
                    <li>Bendahara akan memverifikasi pembayaran Anda secara manual.</li>
                  </ol>
                </div>

                <button
                  onClick={handleConfirmManual}
                  disabled={confirming}
                  className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {confirming ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Konfirmasi Saya Sudah Bayar</span>
                </button>
              </div>
            )}

            {/* Metode Detil: QRIS */}
            {activeRequest.paymentMethod === 'QRIS' && (
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-bold text-text-primary text-center">Scan Kode QRIS</h3>
                
                <div className="overflow-hidden border border-border-default bg-white p-3 shadow-sm rounded-lg max-w-[280px] mx-auto">
                  <Image
                    src="/qrisrimayah.jpg"
                    alt="QRIS Rimayatul Khail"
                    width={908}
                    height={1280}
                    className="mx-auto h-auto w-full"
                    priority
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-text-tertiary font-semibold">Langkah Scan QRIS:</div>
                  <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1 ml-1 leading-relaxed">
                    <li>Unduh gambar QR di atas atau arahkan pemindai langsung.</li>
                    <li>Buka aplikasi pembayaran pilihan Anda (DANA, GoPay, OVO, LinkAja, BCA, dll.).</li>
                    <li>Pilih opsi scan/pindai QR dari galeri atau kamera.</li>
                    <li><strong>PENTING:</strong> Masukkan jumlah bayar tepat <strong>{formatRupiah(activeRequest.amountTotal)}</strong>.</li>
                    <li>Selesaikan transaksi, kemudian silakan klik tombol konfirmasi di bawah ini.</li>
                  </ol>
                </div>

                <button
                  onClick={handleConfirmManual}
                  disabled={confirming}
                  className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {confirming ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Konfirmasi Saya Sudah Bayar</span>
                </button>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setActiveRequest(null)
                  setSelectedMethod(null)
                }}
                className="btn btn-secondary w-full text-sm font-medium border border-border-default bg-surface-elevated hover:bg-border-subtle"
              >
                Ganti Metode Pembayaran
              </button>

            </div>

          </div>
        )}

        {/* Jika Request Expired */}
        {activeRequest && activeRequest.status === 'EXPIRED' && (
          <div className="card p-6 text-center space-y-4 animate-fade-in border-danger/30">
            <AlertCircle className="w-12 h-12 text-danger mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-primary">Waktu Pembayaran Habis</h3>
              <p className="text-xs text-text-tertiary leading-relaxed">
                Batas waktu 2 jam telah terlewati. Silakan buat request pembayaran baru agar kode unik diperbarui.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveRequest(null)
                setSelectedMethod(null)
              }}
              className="btn btn-primary w-full text-sm"
            >
              Buat Request Baru
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default function PembayaranPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="skeleton w-12 h-12 rounded-full" />
      </div>
    }>
      <PembayaranContent />
    </Suspense>
  )
}
