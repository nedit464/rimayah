'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Landmark,
  ReceiptText,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useCounterAnimation } from '@/hooks/use-counter-animation'

interface SnapshotData {
  totalBalance: number
  incomeThisMonth: number
  expenseThisMonth: number
  activeMembers: number
  currentMonthPaid: number
  currentMonthTotal: number
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatCurrencyShort(value: number) {
  const absolute = Math.abs(value)

  if (absolute >= 1_000_000) {
    const compactValue = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000)
    return `Rp ${compactValue} jt`
  }

  if (absolute >= 1_000) {
    const compactValue = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(value / 1_000)
    return `Rp ${compactValue} rb`
  }

  return currencyFormatter.format(value)
}

function AnimatedNumber({
  value,
  isCurrency = false,
  compact = false,
}: {
  value: number
  isCurrency?: boolean
  compact?: boolean
}) {
  const animated = useCounterAnimation(value)

  if (isCurrency) {
    return (
      <span className="font-mono-num">
        {compact ? formatCurrencyShort(animated) : currencyFormatter.format(animated)}
      </span>
    )
  }

  return <span className="font-mono-num">{animated.toLocaleString('id-ID')}</span>
}

function MetricValue({
  value,
  isCurrency,
  compact,
}: {
  value?: number
  isCurrency?: boolean
  compact?: boolean
}) {
  if (value === undefined) {
    return <span className="font-mono-num text-text-disabled">-</span>
  }

  return <AnimatedNumber value={value} isCurrency={isCurrency} compact={compact} />
}

export default function HomePage() {
  const router = useRouter()
  const [searchName, setSearchName] = useState('')
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null)

  useEffect(() => {
    fetch('/api/public/billing-summary')
      .then(res => res.json())
      .then(setSnapshot)
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchName.trim()) {
      router.push(`/cek-kas?q=${encodeURIComponent(searchName.trim())}`)
    }
  }

  const progressPercent = snapshot && snapshot.currentMonthTotal > 0
    ? Math.round((snapshot.currentMonthPaid / snapshot.currentMonthTotal) * 100)
    : 0
  const pendingMembers = snapshot
    ? Math.max(snapshot.currentMonthTotal - snapshot.currentMonthPaid, 0)
    : undefined
  const netMovement = snapshot
    ? snapshot.incomeThisMonth - snapshot.expenseThisMonth
    : undefined

  const heroRows = useMemo(() => [
    {
      label: 'Saldo tercatat',
      value: snapshot?.totalBalance,
      tone: 'text-emerald-bright',
      width: '78%',
    },
    {
      label: 'Iuran masuk',
      value: snapshot?.incomeThisMonth,
      tone: 'text-gold-bright',
      width: '56%',
    },
    {
      label: 'Pengeluaran',
      value: snapshot?.expenseThisMonth,
      tone: 'text-danger',
      width: '34%',
    },
  ], [snapshot])

  const snapshotMetrics = [
    {
      icon: Wallet,
      label: 'Saldo kas',
      value: snapshot?.totalBalance,
      isCurrency: true,
      tone: 'text-emerald-bright',
    },
    {
      icon: TrendingUp,
      label: 'Masuk bulan ini',
      value: snapshot?.incomeThisMonth,
      isCurrency: true,
      tone: 'text-gold-bright',
    },
    {
      icon: TrendingDown,
      label: 'Keluar bulan ini',
      value: snapshot?.expenseThisMonth,
      isCurrency: true,
      tone: 'text-danger',
    },
    {
      icon: Users,
      label: 'Anggota aktif',
      value: snapshot?.activeMembers,
      isCurrency: false,
      tone: 'text-info',
    },
  ]

  const quickLinks = [
    {
      href: '/cek-kas',
      icon: ReceiptText,
      label: 'Cek Kas',
      description: 'Cari nama anggota dan lihat status tagihan terbaru.',
    },
    {
      href: '/transparansi',
      icon: Landmark,
      label: 'Transparansi',
      description: 'Baca posisi saldo, arus kas, dan transaksi organisasi.',
    },
    {
      href: '/pengumuman',
      icon: Bell,
      label: 'Pengumuman',
      description: 'Ikuti pembaruan resmi dari pengurus dan bendahara.',
    },
  ]

  const progressRingStyle = {
    background: `conic-gradient(var(--color-emerald-bright) ${progressPercent * 3.6}deg, var(--progress-track) 0deg)`,
  }

  return (
    <div className="overflow-x-hidden bg-surface-base">
      <section className="relative min-h-[66svh] overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(90deg, black 0%, black 58%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at top left, var(--hero-glow), transparent 38%), linear-gradient(180deg, transparent 0%, var(--hero-fade) 96%)',
          }}
        />

        <div className="home-ledger-visual absolute bottom-0 right-0 top-0 hidden w-[54%] lg:block">
          <div className="absolute right-[-8%] top-12 h-[560px] w-[760px] -rotate-6 border-y border-border-subtle bg-surface-1/35">
            <div className="grid h-full grid-cols-[1fr_1.7fr_1fr] divide-x divide-border-subtle">
              <div className="space-y-5 p-8">
                <div className="h-2 w-16 bg-emerald-bright/50" />
                <div className="space-y-3">
                  {[72, 48, 64, 38, 58].map((width, index) => (
                    <div key={index} className="h-1.5 bg-border-default" style={{ width: `${width}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-end gap-5 p-10">
                {heroRows.map(row => (
                  <div key={row.label} className="border-b border-border-subtle pb-4">
                    <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase text-text-tertiary">
                      <span>{row.label}</span>
                      <span className={row.tone}>
                        {row.value === undefined ? '-' : formatCurrencyShort(row.value)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-3">
                      <div className="h-full bg-emerald-bright/60" style={{ width: row.width }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-rows-4 divide-y divide-border-subtle">
                {[CheckCircle2, Clock3, FileText, Shield].map((Icon, index) => (
                  <div key={index} className="flex items-center justify-center">
                    <Icon className="h-7 w-7 text-text-tertiary/70" strokeWidth={1.4} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[66svh] w-full max-w-7xl items-center px-6 py-16 md:px-10 md:py-20 lg:px-16">
          <div className="w-full min-w-0 max-w-3xl space-y-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 border border-emerald-dim bg-emerald-subtle px-3 py-1.5 text-xs font-semibold uppercase text-emerald-bright">
                <Shield className="h-3.5 w-3.5" />
                Portal kas resmi
              </span>
              <span className="text-xs uppercase text-text-tertiary">
                Dicatat oleh bendahara, dibaca oleh anggota
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-full break-words font-heading text-4xl leading-[0.98] text-text-primary sm:text-6xl lg:text-7xl">
                Sa&apos;ad Al-Furusiyah
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-text-secondary md:text-xl">
                Portal keuangan organisasi yang menyatukan iuran anggota, saldo dana, dan pengumuman resmi dalam satu pengalaman yang jelas, rapi, dan dapat dipercaya.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/cek-kas" className="btn btn-primary btn-lg group">
                Cek Status Iuran
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/transparansi" className="btn btn-secondary btn-lg">
                <Eye className="h-4 w-4" />
                Lihat Buku Kas
              </Link>
            </div>

            <dl className="grid max-w-2xl grid-cols-3 divide-x divide-border-subtle border-y border-border-subtle">
              <div className="py-4 pr-4">
                <dt className="text-xs uppercase text-text-tertiary">Saldo</dt>
                <dd className="mt-1 text-lg font-semibold text-emerald-bright">
                  <MetricValue value={snapshot?.totalBalance} isCurrency compact />
                </dd>
              </div>
              <div className="px-4 py-4">
                <dt className="text-xs uppercase text-text-tertiary">Progres</dt>
                <dd className="mt-1 font-mono-num text-lg font-semibold text-text-primary">
                  {snapshot ? `${progressPercent}%` : '-'}
                </dd>
              </div>
              <div className="py-4 pl-4">
                <dt className="text-xs uppercase text-text-tertiary">Anggota</dt>
                <dd className="mt-1 text-lg font-semibold text-info">
                  <MetricValue value={snapshot?.activeMembers} />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-surface-1/70">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle md:grid-cols-4 md:divide-y-0">
            {snapshotMetrics.map(item => (
              <div key={item.label} className="min-h-36 px-4 py-6 md:px-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <item.icon className={`h-5 w-5 ${item.tone}`} strokeWidth={1.6} />
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
                <p className={`text-xl font-semibold ${item.tone} md:text-2xl`}>
                  <MetricValue value={item.value} isCurrency={item.isCurrency} compact />
                </p>
                <p className="mt-2 text-xs uppercase text-text-tertiary">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase text-emerald-bright">
                  Status iuran
                </p>
                <h2 className="font-heading text-3xl leading-tight text-text-primary md:text-4xl">
                  Satu pandangan untuk tahu kas sedang sehat atau perlu ditindaklanjuti.
                </h2>
              </div>

              <p className="max-w-xl leading-7 text-text-secondary">
                Anggota bisa memeriksa kewajiban sendiri tanpa menunggu rekap manual. Bendahara tetap memegang verifikasi, sementara data publik tetap ringkas dan mudah dipahami.
              </p>

              <form onSubmit={handleSearch} className="border border-border-default bg-surface-1 p-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative flex-1">
                    <span className="sr-only">Nama anggota</span>
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Ketik nama lengkap anggota"
                      className="input border-transparent bg-surface-base"
                      style={{ paddingLeft: '3rem' }}
                    />
                  </label>
                  <button type="submit" className="btn btn-primary sm:min-w-36">
                    Cek
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="border border-border-default bg-surface-1 p-6">
                <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-full p-2" style={progressRingStyle}>
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-surface-base">
                    <span className="font-mono-num text-3xl font-semibold text-emerald-bright">
                      {snapshot ? progressPercent : '-'}%
                    </span>
                    <span className="mt-1 text-xs uppercase text-text-tertiary">lunas</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-text-tertiary">Sudah bayar</span>
                    <span className="font-mono-num text-text-primary">
                      {snapshot ? snapshot.currentMonthPaid : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-tertiary">Perlu tindak lanjut</span>
                    <span className="font-mono-num text-gold-bright">
                      {pendingMembers ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-border-subtle pt-3">
                    <span className="text-text-tertiary">Total tagihan</span>
                    <span className="font-mono-num text-text-primary">
                      {snapshot ? snapshot.currentMonthTotal : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-border-default bg-surface-1">
                <div className="border-b border-border-subtle p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase text-text-tertiary">Arus kas bulan ini</p>
                      <p className="mt-2 text-2xl font-semibold text-text-primary">
                        <MetricValue value={netMovement} isCurrency compact />
                      </p>
                    </div>
                    <Wallet className="h-5 w-5 text-emerald-bright" strokeWidth={1.6} />
                  </div>
                </div>
                <div className="divide-y divide-border-subtle">
                  {[
                    {
                      label: 'Pemasukan',
                      value: snapshot?.incomeThisMonth,
                      tone: 'text-emerald-bright',
                      bar: '#10b981',
                      width: '74%',
                    },
                    {
                      label: 'Pengeluaran',
                      value: snapshot?.expenseThisMonth,
                      tone: 'text-danger',
                      bar: '#ef4444',
                      width: '42%',
                    },
                    {
                      label: 'Saldo akhir',
                      value: snapshot?.totalBalance,
                      tone: 'text-gold-bright',
                      bar: '#f59e0b',
                      width: '88%',
                    },
                  ].map(row => (
                    <div key={row.label} className="p-6">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <span className="text-sm text-text-secondary">{row.label}</span>
                        <span className={`text-sm font-semibold ${row.tone}`}>
                          <MetricValue value={row.value} isCurrency compact />
                        </span>
                      </div>
                      <div className="h-2 bg-surface-3">
                        <div className="h-full opacity-80" style={{ width: row.width, backgroundColor: row.bar }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border-subtle bg-surface-1/70 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-emerald-bright">
                Akses utama
              </p>
              <h2 className="font-heading text-3xl text-text-primary md:text-4xl">
                Dirancang untuk rutinitas bendahara dan anggota.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-text-tertiary">
              Navigasi dibuat pendek: cek kewajiban, baca rekap, lalu ikuti pengumuman tanpa berpindah ke banyak kanal.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickLinks.map(item => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="group block h-full border border-border-default bg-surface-base p-6 transition-colors hover:border-emerald-base/50 hover:bg-surface-2"
                >
                  <div className="mb-10 flex items-start justify-between gap-4">
                    <item.icon className="h-6 w-6 text-emerald-bright" strokeWidth={1.5} />
                    <ArrowRight className="h-4 w-4 text-text-tertiary transition-transform group-hover:translate-x-1 group-hover:text-emerald-bright" />
                  </div>
                  <h3 className="font-heading text-2xl text-text-primary">{item.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-tertiary">{item.description}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
