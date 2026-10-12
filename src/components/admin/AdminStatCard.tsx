import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

export type AdminStatTone = 'primary' | 'success' | 'violet' | 'info' | 'warning' | 'danger'

/**
 * Every class spelled out in full, so Tailwind keeps them: a strip along the
 * top, a faint wash of the colour, a solid icon badge and a matching hover.
 */
const TONES: Record<
  AdminStatTone,
  { strip: string; wash: string; icon: string; hover: string; link: string }
> = {
  primary: {
    strip: 'from-primary-500 to-primary-400',
    wash: 'from-primary-50/80',
    icon: 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/30',
    hover: 'hover:border-primary-200',
    link: 'text-primary-600',
  },
  success: {
    strip: 'from-emerald-500 to-emerald-400',
    wash: 'from-emerald-50/80',
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    hover: 'hover:border-emerald-200',
    link: 'text-emerald-600',
  },
  violet: {
    strip: 'from-violet-500 to-violet-400',
    wash: 'from-violet-50/80',
    icon: 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30',
    hover: 'hover:border-violet-200',
    link: 'text-violet-600',
  },
  info: {
    strip: 'from-sky-500 to-sky-400',
    wash: 'from-sky-50/80',
    icon: 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-sky-500/30',
    hover: 'hover:border-sky-200',
    link: 'text-sky-600',
  },
  warning: {
    strip: 'from-amber-500 to-amber-400',
    wash: 'from-amber-50/80',
    icon: 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/30',
    hover: 'hover:border-amber-200',
    link: 'text-amber-600',
  },
  danger: {
    strip: 'from-red-500 to-red-400',
    wash: 'from-red-50/80',
    icon: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30',
    hover: 'hover:border-red-200',
    link: 'text-red-600',
  },
}

interface AdminStatCardProps {
  label: string
  /** Already formatted. */
  value: string
  icon: LucideIcon
  tone: AdminStatTone
  hint?: string
  /** Where the figure is listed row by row. Without it the card is static. */
  to?: string
  newTab?: boolean
  loading?: boolean
}

/**
 * One figure on the admin dashboard, highlighted in its own colour: the colour
 * says what kind of figure it is, the number is the largest thing on the card.
 */
export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  to,
  newTab = false,
  loading,
}: AdminStatCardProps) {
  const t = TONES[tone]

  const body = (
    <>
      <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', t.strip)} />
      {/* A faint wash of the colour in the corner, behind everything else. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br via-white/0 to-white/0',
          t.wash,
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="line-clamp-2 min-h-8 min-w-0 text-[11px] font-bold uppercase leading-4 tracking-wider text-slate-500">
          {label}
        </p>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg',
            t.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="relative">
        {loading ? (
          <Skeleton className="mt-2 h-8 w-16 rounded-md" />
        ) : (
          <p className="mt-1 truncate text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
          {to && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold opacity-80 transition-opacity group-hover:opacity-100',
                t.link,
              )}
            >
              <span className="sr-only">View list</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </>
  )

  const className = cn(
    'group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pt-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
    t.hover,
    to && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
  )

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
