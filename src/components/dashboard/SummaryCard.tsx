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

const TONES: Record<SummaryTone, { icon: string; ring: string }> = {
  primary: { icon: 'bg-primary-50 text-primary-600', ring: 'hover:border-primary-200' },
  info: { icon: 'bg-sky-50 text-sky-600', ring: 'hover:border-sky-200' },
  violet: { icon: 'bg-violet-50 text-violet-600', ring: 'hover:border-violet-200' },
  success: { icon: 'bg-emerald-50 text-emerald-600', ring: 'hover:border-emerald-200' },
  warning: { icon: 'bg-amber-50 text-amber-600', ring: 'hover:border-amber-200' },
  danger: { icon: 'bg-red-50 text-red-600', ring: 'hover:border-red-200' },
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
  loading,
}: SummaryCardProps) {
  const tones = TONES[tone]

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 min-h-8 min-w-0 text-[11px] font-bold uppercase leading-4 tracking-wider text-slate-500 lg:min-h-0">
          {label}
        </p>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            tones.icon,
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
    'block rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-colors',
    to && tones.ring,
  )

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
