import { CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Every class written out in full, so Tailwind keeps them. */
const TONES = {
  primary: {
    icon: 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/30',
    selected: 'border-primary-500 ring-4 ring-primary-100 bg-primary-50/40',
    hover: 'hover:border-primary-300',
    check: 'text-primary-600',
  },
  success: {
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    selected: 'border-emerald-500 ring-4 ring-emerald-100 bg-emerald-50/40',
    hover: 'hover:border-emerald-300',
    check: 'text-emerald-600',
  },
  violet: {
    icon: 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30',
    selected: 'border-violet-500 ring-4 ring-violet-100 bg-violet-50/40',
    hover: 'hover:border-violet-300',
    check: 'text-violet-600',
  },
  info: {
    icon: 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-sky-500/30',
    selected: 'border-sky-500 ring-4 ring-sky-100 bg-sky-50/40',
    hover: 'hover:border-sky-300',
    check: 'text-sky-600',
  },
  warning: {
    icon: 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/30',
    selected: 'border-amber-500 ring-4 ring-amber-100 bg-amber-50/40',
    hover: 'hover:border-amber-300',
    check: 'text-amber-600',
  },
  danger: {
    icon: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30',
    selected: 'border-red-500 ring-4 ring-red-100 bg-red-50/40',
    hover: 'hover:border-red-300',
    check: 'text-red-600',
  },
  /** For what is switched off rather than wrong — inactive plans, say. */
  neutral: {
    icon: 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/30',
    selected: 'border-slate-500 ring-4 ring-slate-200 bg-slate-50',
    hover: 'hover:border-slate-300',
    check: 'text-slate-600',
  },
}

export type FilterCardTone = keyof typeof TONES

interface FilterCardProps {
  icon: LucideIcon
  label: string
  /** Already formatted. */
  value: string
  /** A short line under the figure — what it adds up to, say. */
  hint?: string
  tone: FilterCardTone
  selected: boolean
  onClick: () => void
  /**
   * For cards laid two across on a phone: below `sm` the icon sits above the
   * text and the tick moves to the corner, so the label and figures get the
   * card's whole width instead of being cut short.
   */
  stackOnMobile?: boolean
}

/**
 * A count that is also the filter for it: tap it and the list below narrows
 * to those rows. The selected one carries its colour, a ring and a tick.
 */
export function FilterCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  selected,
  onClick,
  stackOnMobile = false,
}: FilterCardProps) {
  const t = TONES[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex rounded-2xl border bg-white py-3.5 text-left shadow-card transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100',
        // One layout's classes or the other's, never both: without a class merger
        // two alignments on one element is decided by stylesheet order, not intent.
        stackOnMobile
          ? 'flex-col items-start gap-2 px-3.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4'
          : 'items-center gap-3 px-4',
        selected ? t.selected : cn('border-slate-200 hover:-translate-y-0.5 hover:shadow-md', t.hover),
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl text-white shadow-lg',
          stackOnMobile ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-10 w-10',
          t.icon,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className={cn('min-w-0 flex-1', stackOnMobile && 'w-full sm:w-auto')}>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold leading-tight tracking-tight text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs tabular-nums text-slate-500">{hint}</p>}
      </div>
      {selected && (
        <CheckCircle2
          className={cn(
            'h-5 w-5 shrink-0',
            stackOnMobile && 'absolute right-3 top-3 sm:static',
            t.check,
          )}
        />
      )}
    </button>
  )
}
