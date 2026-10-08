import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * What the figure is about, which is what gives the tile its colour: the
 * garage's own records in the app's blue, the money in green, and anything
 * still waiting on the garage in amber or red.
 */
export type SummaryTone = 'primary' | 'info' | 'violet' | 'success' | 'warning' | 'danger'

const TONES: Record<
  SummaryTone,
  { icon: string; iconActive: string; ring: string; active: string; bar: string }
> = {
  primary: {
    icon: 'bg-primary-50 text-primary-600',
    iconActive: 'bg-primary-600 text-white',
    ring: 'hover:border-primary-200',
    active: 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-100',
    bar: 'bg-primary-500',
  },
  info: {
    icon: 'bg-sky-50 text-sky-600',
    iconActive: 'bg-sky-600 text-white',
    ring: 'hover:border-sky-200',
    active: 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-100',
    bar: 'bg-sky-500',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600',
    iconActive: 'bg-violet-600 text-white',
    ring: 'hover:border-violet-200',
    active: 'border-violet-500 bg-violet-50/60 ring-2 ring-violet-100',
    bar: 'bg-violet-500',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-600',
    iconActive: 'bg-emerald-600 text-white',
    ring: 'hover:border-emerald-200',
    active: 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100',
    bar: 'bg-emerald-500',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600',
    iconActive: 'bg-amber-500 text-white',
    ring: 'hover:border-amber-200',
    active: 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-100',
    bar: 'bg-amber-500',
  },
  danger: {
    icon: 'bg-red-50 text-red-600',
    iconActive: 'bg-red-600 text-white',
    ring: 'hover:border-red-200',
    active: 'border-red-500 bg-red-50/60 ring-2 ring-red-100',
    bar: 'bg-red-500',
  },
}

export interface SummaryCardProps {
  label: string
  /** Already formatted — a count, or money with its symbol. */
  value: string
  icon: LucideIcon
  tone?: SummaryTone
  /** A line under the figure saying what it is counted over. */
  hint?: string
  /** Where the figure can be seen row by row. Without it the tile is static. */
  to?: string
  /** Opens `to` in a new tab, so the dashboard tab stays as it was. */
  newTab?: boolean
  /**
   * Makes the tile a toggle that opens its rows on the dashboard itself,
   * instead of a link to another screen. Takes precedence over `to`.
   */
  onClick?: () => void
  /** Draws the tile as the selected one — its rows are the panel on show. */
  active?: boolean
  /** Draws the tile with a bar in place of the figure while it is fetched. */
  loading?: boolean
}

/**
 * One figure on the dashboard.
 *
 * The label sits above the number rather than beside it, so a column of tiles
 * reads down the numbers — which is what the eye is here for — and the icon
 * carries the colour that says which kind of figure it is.
 */
export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  to,
  newTab = false,
  onClick,
  active = false,
  loading,
}: SummaryCardProps) {
  const tones = TONES[tone]

  const body = (
    <>
      {/* A strip along the top edge marks the selected tile at a glance. */}
      {active && <span className={cn('absolute inset-x-0 top-0 h-1', tones.bar)} />}

      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 min-h-8 min-w-0 text-[11px] font-bold uppercase leading-4 tracking-wider text-slate-500 lg:min-h-0">
          {label}
        </p>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
            active ? tones.iconActive : tones.icon,
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-7 w-20 rounded-md" />
      ) : (
        <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      )}

      {hint && <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>}
    </>
  )

  const className = cn(
    'relative block w-full overflow-hidden rounded-xl border bg-white p-4 text-left shadow-card transition-all',
    active ? tones.active : 'border-slate-200',
    (to || onClick) && !active && cn(tones.ring, 'hover:-translate-y-0.5 hover:shadow-md'),
    onClick &&
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={className}>
        {body}
      </button>
    )
  }

  return to ? (
    <Link
      to={to}
      className={className}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
