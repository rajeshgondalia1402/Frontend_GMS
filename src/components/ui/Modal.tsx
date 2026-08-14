import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  /** On mobile render as a bottom sheet (default true) */
  sheetOnMobile?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }

export function Modal({ open, onClose, title, children, footer, sheetOnMobile = true, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 flex w-full flex-col bg-white shadow-xl',
          sheetOnMobile
            ? 'mt-auto max-h-[92vh] rounded-t-2xl animate-slide-up sm:mt-0 sm:max-h-[90vh] sm:rounded-2xl sm:animate-scale-in'
            : 'mt-auto max-h-[92vh] rounded-t-2xl animate-slide-up sm:m-4 sm:max-h-[90vh] sm:rounded-2xl',
          sizes[size],
        )}
      >
        {sheetOnMobile && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-300 sm:hidden" />}
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
