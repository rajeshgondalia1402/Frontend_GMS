import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'left' | 'right'
  width?: string
}

export function Drawer({ open, onClose, children, side = 'left', width = 'w-72' }: DrawerProps) {
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'absolute inset-y-0 bg-white shadow-xl transition-transform',
          width,
          side === 'left' ? 'left-0' : 'right-0',
        )}
        style={{ animation: 'slideIn 0.2s ease-out' }}
      >
        {children}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(${side === 'left' ? '-100%' : '100%'})}to{transform:translateX(0)}}`}</style>
    </div>,
    document.body,
  )
}
