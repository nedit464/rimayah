'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/use-debounce'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { formatRupiah } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils'
import { Skeleton } from '@/components/shared/LoadingSkeleton'

interface MemberResult {
  id: string
  name: string
  status: 'AKTIF' | 'NONAKTIF'
  memberBillings: {
    id: string
    status: 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGAK' | 'LUNAS'
    paidAt: string | null
    billing: {
      id: string
      title: string
      amount: number
      dueDate: string
      type: string
    }
  }[]
}

function CekKasContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<MemberResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    fetch(`/api/public/members/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(data => {
        setResults(Array.isArray(data) ? data : [])
        setSearched(true)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  return (
    <div className="min-h-[80vh] bg-surface-base">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-20">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-4xl text-text-primary mb-3">
            Cek Status Iuran
          </h1>
          <p className="text-text-tertiary max-w-md mx-auto">
            Masukkan namamu untuk melihat status pembayaran iuran dan tagihan.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div {...fadeUp} className="relative max-w-lg mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama lengkap..."
            className="input pl-12 py-3 text-base"
            autoFocus
          />
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" {...fadeUp} className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="card p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ))}
            </motion.div>
          ) : searched && results.length === 0 ? (
            <motion.div key="empty" {...fadeUp}>
              <EmptyState
                icon={<AlertCircle className="w-7 h-7 text-text-tertiary" />}
                title="Anggota tidak ditemukan"
                description="Pastikan nama yang dimasukkan sudah benar."
              />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              {...staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {results.map((member) => {
                const arrears = member.memberBillings.filter(
                  mb => mb.status === 'MENUNGGAK' || mb.status === 'BELUM_BAYAR'
                )
                const totalArrears = arrears.reduce((sum, mb) => sum + Number(mb.billing.amount), 0)

                return (
                  <motion.div key={member.id} {...fadeUp} className="card overflow-hidden">
                    {/* Member header */}
                    <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-subtle flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-bright" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{member.name}</h3>
                          <StatusBadge status={member.status} />
                        </div>
                      </div>
                      {totalArrears > 0 && (
                        <div className="sm:text-right">
                          <p className="text-xs text-text-tertiary">Total Tunggakan</p>
                          <p className="font-mono-num text-lg font-bold text-danger">
                            {formatRupiah(totalArrears)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Billing table */}
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tagihan</th>
                            <th>Jumlah</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {member.memberBillings.map((mb) => (
                            <tr key={mb.id}>
                              <td className="font-medium text-text-primary">{mb.billing.title}</td>
                              <td className="font-mono-num">{formatRupiah(Number(mb.billing.amount))}</td>
                              <td>{formatDateShort(mb.billing.dueDate)}</td>
                              <td><StatusBadge status={mb.status} /></td>
                              <td>
                                {(mb.status === 'BELUM_BAYAR' || mb.status === 'MENUNGGAK') && (
                                  <Link
                                    href={`/pembayaran?billing=${mb.billing.id}&member=${member.id}&mb=${mb.id}`}
                                    className="btn btn-primary btn-sm"
                                  >
                                    Bayar
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function CekKasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="skeleton w-12 h-12 rounded-full" />
      </div>
    }>
      <CekKasContent />
    </Suspense>
  )
}
