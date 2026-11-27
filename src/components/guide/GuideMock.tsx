import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, Pointer } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Small look-alikes of the real screens, used by the animated guide. They are
 * drawings, not the real components — nothing here talks to the API — but
 * they copy the real labels and colours, so what the owner sees in the guide
 * is what they will find in the app.
 *
 * Timing: every piece takes a `delay` (ms from the moment the step opens).
 * The player remounts a step to replay it, which restarts every timer.
 */

const reducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

const delayStyle = (delay = 0): CSSProperties => ({ '--g-delay': `${delay}ms` }) as CSSProperties

/** True once `ms` has passed since mount — for a state change "after the tap". */
export function useAfter(ms: number | undefined): boolean {
  const [done, setDone] = useState(() => ms === undefined || ms <= 0 || reducedMotion())
  useEffect(() => {
    if (done || ms === undefined) return
    const t = window.setTimeout(() => setDone(true), ms)
    return () => window.clearTimeout(t)
  }, [done, ms])
  return done
}

/** Fades and slides its children in after `delay`. */
export function In({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('g-in', className)} style={delayStyle(delay)}>
      {children}
    </div>
  )
}

/** Types `text` out letter by letter, starting after `delay`. */
export function Typed({
  text,
  delay = 0,
  speed = 70,
  className,
}: {
  text: string
  delay?: number
  speed?: number
  className?: string
}) {
  const [count, setCount] = useState(() => (reducedMotion() ? text.length : 0))

  useEffect(() => {
    if (count >= text.length) return
    const t = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? delay : speed)
    return () => window.clearTimeout(t)
  }, [count, delay, speed, text.length])

  const typing = count > 0 && count < text.length
  return (
    <span className={className}>
      {text.slice(0, count)}
      {typing && <span className="g-caret ml-px inline-block h-[1em] w-px translate-y-[2px] bg-current" />}
    </span>
  )
}

/** A finger that comes in and taps, with a ripple. Put it in a `relative` box. */
export function Tap({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute -bottom-3 right-2 z-10', className)}
      style={delayStyle(delay)}
    >
      <span className="g-ripple absolute -left-1 -top-1 h-6 w-6 rounded-full bg-accent-500/60" style={delayStyle(delay)} />
      <span className="g-finger relative block" style={delayStyle(delay)}>
        <Pointer className="h-7 w-7 fill-white text-slate-800 drop-shadow-md" strokeWidth={1.75} />
      </span>
    </span>
  )
}

/** The phone the clips play in. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[320px] rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-primary-950/30',
        className,
      )}
    >
      <div className="absolute left-1/2 top-0 z-20 h-4 w-24 -translate-x-1/2 rounded-b-xl bg-slate-900" />
      <div className="relative h-[480px] overflow-hidden rounded-[1.5rem] bg-slate-50 sm:h-[540px]">{children}</div>
    </div>
  )
}

/** One app screen: a header bar with the page name, and its body. */
export function MockScreen({
  title,
  back = false,
  dark = false,
  children,
  footer,
}: {
  title: string
  back?: boolean
  /** The navy header the public site and sign-in pages use. */
  dark?: boolean
  children: ReactNode
  /** Pinned to the bottom, like the sticky save bar or the bottom menu. */
  footer?: ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center gap-2 px-4 pb-3 pt-7 text-sm font-bold',
          dark ? 'bg-brand-navy text-white' : 'border-b border-slate-200 bg-white text-slate-900',
        )}
      >
        {back && <ChevronLeft className="h-4 w-4 shrink-0 opacity-60" />}
        <img src="/brand/garagepilot-logo.png" alt="" className="h-5 w-5 rounded object-contain" />
        <span className="truncate">{title}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden p-4">{children}</div>
      {footer && <div className="border-t border-slate-200 bg-white p-3">{footer}</div>}
    </div>
  )
}

/** A labelled input whose value types itself in. */
export function MockField({
  label,
  value,
  delay = 0,
  placeholder,
  mask = false,
  right,
}: {
  label: string
  value?: string
  delay?: number
  placeholder?: string
  /** Shows dots, like a password. */
  mask?: boolean
  right?: ReactNode
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold text-slate-600">{label}</p>
      <div className="flex h-9 items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
        {value ? (
          <Typed text={mask ? '•'.repeat(value.length) : value} delay={delay} />
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        {right}
      </div>
    </div>
  )
}

const BUTTON_TONES = {
  primary: 'bg-primary-600 text-white',
  outline: 'border border-slate-300 bg-white text-slate-700',
  success: 'bg-emerald-600 text-white',
  accent: 'bg-accent-500 text-white',
  soft: 'border border-primary-200 bg-primary-50 text-primary-700',
} as const

/** A button, optionally tapped by the finger at `tapAt`. */
export function MockButton({
  children,
  tone = 'primary',
  tapAt,
  className,
  icon,
}: {
  children: ReactNode
  tone?: keyof typeof BUTTON_TONES
  tapAt?: number
  className?: string
  icon?: ReactNode
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold shadow-sm',
          BUTTON_TONES[tone],
          tapAt !== undefined && 'g-press',
        )}
        style={delayStyle(tapAt)}
      >
        {icon}
        {children}
      </div>
      {tapAt !== undefined && <Tap delay={tapAt} />}
    </div>
  )
}

/** A choice chip that becomes picked at `pickAt` (tapped by the finger). */
export function MockChip({
  label,
  picked = false,
  pickAt,
  tone = 'primary',
}: {
  label: string
  picked?: boolean
  pickAt?: number
  tone?: 'primary' | 'emerald' | 'violet' | 'sky' | 'amber'
}) {
  const on = useAfter(pickAt === undefined ? undefined : pickAt + 600) && (picked || pickAt !== undefined)
  const onTone = {
    primary: 'border-primary-600 bg-primary-600 text-white',
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-500 bg-violet-50 text-violet-700',
    sky: 'border-sky-500 bg-sky-50 text-sky-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
  }[tone]

  return (
    <span className="relative inline-block">
      <span
        className={cn(
          'inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors duration-300',
          on || (picked && pickAt === undefined) ? onTone : 'border-slate-300 bg-white text-slate-600',
        )}
      >
        {label}
      </span>
      {pickAt !== undefined && <Tap delay={pickAt} className="-bottom-4 right-0" />}
    </span>
  )
}

const BADGE_TONES = {
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  sky: 'bg-sky-100 text-sky-800 ring-sky-200',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  red: 'bg-red-100 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  violet: 'bg-violet-100 text-violet-700 ring-violet-200',
} as const

export type MockTone = keyof typeof BADGE_TONES

export function MockBadge({ label, tone }: { label: string; tone: MockTone }) {
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', BADGE_TONES[tone])}>
      {label}
    </span>
  )
}

/** A white card, the way lists and summaries sit in the app. */
export function MockCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-slate-200 bg-white p-3 shadow-sm', className)}>{children}</div>
}

/** The three-step "Customer → Vehicle → Done" strip from the add-customer flow. */
export function MockSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-white p-2 ring-1 ring-slate-200">
      {steps.map((s, i) => (
        <div key={s} className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
              i < current && 'bg-emerald-500 text-white',
              i === current && 'bg-primary-600 text-white',
              i > current && 'bg-slate-200 text-slate-500',
            )}
          >
            {i < current ? '✓' : i + 1}
          </span>
          <span className={cn('truncate text-[11px] font-semibold', i === current ? 'text-slate-900' : 'text-slate-500')}>
            {s}
          </span>
        </div>
      ))}
    </div>
  )
}
