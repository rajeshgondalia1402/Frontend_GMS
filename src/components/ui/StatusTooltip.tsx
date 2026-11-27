import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusTooltipProps {
  /** The badge (or anything) the explanation belongs to. */
  children: ReactNode
  /** The explanation shown in the bubble. */
  content: ReactNode
  /** Read out by screen readers, e.g. "What does Pending mean?". */
  label: string
  className?: string
}

const WIDTH = 300
const GAP = 8
const EDGE = 8

/**
 * Wraps a status badge with a small ⓘ and a bubble that explains, in plain
 * words, what the status means. Hover shows it on a computer; a tap shows it
 * on a phone (tap again or anywhere else to close). The bubble is drawn on top
 * of the page, so a table that scrolls sideways never cuts it off.
 */
export function StatusTooltip({ children, content, label, className }: StatusTooltipProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean; arrow: number } | null>(
    null,
  )
  const triggerRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const pinned = useRef(false)
  const id = useId()

  const place = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const r = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(WIDTH, vw - EDGE * 2)
    const height = bubbleRef.current?.offsetHeight ?? 180
    const center = r.left + r.width / 2
    const left = Math.min(Math.max(center - width / 2, EDGE), vw - width - EDGE)
    const fitsBelow = r.bottom + GAP + height <= vh - EDGE
    const above = !fitsBelow && r.top - GAP - height >= EDGE
    const top = above ? r.top - GAP - height : r.bottom + GAP
    setPos({ top, left, above, arrow: Math.min(Math.max(center - left, 14), width - 14) })
  }, [])

  // Measure once the bubble is drawn, so it can flip above when there is no room below.
  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || bubbleRef.current?.contains(t)) return
      pinned.current = false
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pinned.current = false
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onMove = () => place()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, place])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const toggle = () => {
    pinned.current = !pinned.current || !open
    setOpen(pinned.current)
  }

  const hoverOpen = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hoverClose = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse' || pinned.current) return
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 150)
  }

  return (
    <>
      {/* A span, not a <button>, so it is valid inside a clickable row or link. */}
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!pinned.current) setOpen(false)
        }}
        onClick={(e) => {
          // Inside a clickable row or card, the tap is for the bubble only.
          e.stopPropagation()
          e.preventDefault()
          toggle()
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.stopPropagation()
          e.preventDefault()
          toggle()
        }}
        className={cn(
          'group inline-flex shrink-0 cursor-help items-center gap-1 whitespace-nowrap rounded-full align-middle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
          className,
        )}
      >
        {children}
        <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-primary-600" />
      </span>

      {open &&
        createPortal(
          <div
            ref={bubbleRef}
            id={id}
            role="tooltip"
            onPointerEnter={hoverOpen}
            onPointerLeave={hoverClose}
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: Math.min(WIDTH, window.innerWidth - EDGE * 2),
            }}
            className="fixed z-[100] rounded-xl border border-slate-200 bg-white p-3.5 text-left text-sm text-slate-700 shadow-xl"
          >
            {pos && (
              <span
                className={cn(
                  'absolute h-3 w-3 rotate-45 border-slate-200 bg-white',
                  pos.above ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t',
                )}
                style={{ left: pos.arrow - 6 }}
              />
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                pinned.current = false
                setOpen(false)
              }}
              className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:hidden"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">{content}</div>
          </div>,
          document.body,
        )}
    </>
  )
}
