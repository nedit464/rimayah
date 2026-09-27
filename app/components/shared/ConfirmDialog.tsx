'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { scaleIn } from '@/lib/animations'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  variant = 'default',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop-overlay fixed inset-0"
            onClick={onClose}
          />
          <motion.div
            {...scaleIn}
            className="relative bg-surface-3 border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              {variant === 'danger' && (
                <div className="w-10 h-10 rounded-full bg-danger-muted flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                {description && (
                  <p className="mt-1 text-sm text-text-tertiary">{description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Batal
              </button>
              <button
                onClick={onConfirm}
                className={variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                disabled={loading}
              >
                {loading ? 'Memproses...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
