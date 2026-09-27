'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, ChevronDown, ChevronUp } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { formatDate } from '@/lib/utils'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/public/announcements?page=${page}&limit=10`)
      .then(res => res.json())
      .then(data => {
        setAnnouncements(data.announcements ?? [])
        setTotalPages(data.totalPages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-20">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-12">
          <h1 className="font-heading text-3xl md:text-4xl text-text-primary mb-3">Pengumuman</h1>
          <p className="text-text-tertiary">Informasi terbaru seputar organisasi dan keuangan.</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState title="Belum ada pengumuman" description="Pengumuman akan ditampilkan di sini." />
        ) : (
          <motion.div {...staggerContainer} initial="initial" animate="animate" className="space-y-4">
            {announcements.map(ann => (
              <motion.div key={ann.id} {...fadeUp} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                  className="w-full p-6 text-left flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={ann.type} />
                      {ann.isPinned && <Pin className="w-3.5 h-3.5 text-gold-bright" />}
                    </div>
                    <h3 className="font-heading text-lg text-text-primary truncate">{ann.title}</h3>
                    <p className="text-xs text-text-tertiary mt-1">{formatDate(ann.publishedAt)}</p>
                    {expandedId !== ann.id && (
                      <p className="text-sm text-text-secondary mt-2 line-clamp-2">{ann.content}</p>
                    )}
                  </div>
                  {expandedId === ann.id
                    ? <ChevronUp className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                  }
                </button>

                <AnimatePresence>
                  {expandedId === ann.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-border-subtle">
                        <div className="pt-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
