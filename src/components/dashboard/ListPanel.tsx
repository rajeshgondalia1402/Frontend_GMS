import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PaginationBar } from '@/components/common'
import { Skeleton } from '@/components/ui'
import { agoLabel, cn, formatDate, getInitial } from '@/lib/utils'
import type { Pagination } from '@/types/auth'

/**
 * Every link out of a dashboard panel opens in a new tab, so the dashboard
 * stays exactly as it was - same tile, same list, same page of it - for when
 * the desk comes back to it. The session lives in localStorage, so the new tab
 * is signed in too.
 */
export const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const

/** The same for a row, which is clicked rather than followed like a link. */
export function openInNewTab(path: string): void {
  window.open(path, '_blank', 'noopener,noreferrer')
}

/** Five rows keep a panel short enough that the charts stay in reach. */
export const PANEL_PAGE_SIZE = 5
const PANEL_PAGE_SIZES = [5, 10, 25]

/** A panel's colour, matching the tile that opened it. */
export type ListPanelTone = 'primary' | 'info' | 'violet' | 'warning' | 'danger'

const TONES: Record<
  ListPanelTone,
  { header: string; badge: string; icon: string; empty: string; row: string; button: string }
> = {
  primary: {
    header: 'from-primary-50/80',
    badge: 'bg-primary-100 text-primary-700',
    icon: 'bg-primary-600 shadow-primary-200',
    empty: 'bg-primary-50 text-primary-500',
    row: 'hover:bg-primary-50/40',
    button: 'bg-primary-600 hover:bg-primary-700',
  },
  info: {
    header: 'from-sky-50/80',
    badge: 'bg-sky-100 text-sky-700',
    icon: 'bg-sky-600 shadow-sky-200',
    empty: 'bg-sky-50 text-sky-500',
    row: 'hover:bg-sky-50/40',
    button: 'bg-sky-600 hover:bg-sky-700',
  },
  violet: {
    header: 'from-violet-50/80',
    badge: 'bg-violet-100 text-violet-700',
    icon: 'bg-violet-600 shadow-violet-200',
    empty: 'bg-violet-50 text-violet-500',
    row: 'hover:bg-violet-50/40',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
  warning: {
    header: 'from-amber-50/80',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'bg-amber-500 shadow-amber-200',
    empty: 'bg-amber-50 text-amber-500',
    row: 'hover:bg-amber-50/40',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  danger: {
    header: 'from-red-50/80',
    badge: 'bg-red-100 text-red-700',
    icon: 'bg-red-600 shadow-red-200',
    empty: 'bg-red-50 text-red-500',
    row: 'hover:bg-red-50/40',
    button: 'bg-red-600 hover:bg-red-700',
  },
}

/** The hover tint a panel's rows use, for the row markup each panel draws itself. */
export function panelRowHover(tone: ListPanelTone): string {
  return TONES[tone].row
}

/**
 * Avatar colours, picked by name so the same customer always wears the same
 * one and a page of rows does not read as a wall of one colour.
 */
const AVATAR_TONES = [
  'bg-primary-100 text-primary-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function avatarTone(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length] as string
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        size === 'sm' ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm',
        avatarTone(name),
      )}
    >
      {getInitial(name)}
    </span>
  )
}

/** The date a row was added, with "2 days ago" under it. */
export function AddedOn({ createdAt, align = 'left' }: { createdAt: string; align?: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'shrink-0 text-right' : undefined}>
      <p className="whitespace-nowrap text-sm font-medium text-slate-700">{formatDate(createdAt)}</p>
      <p className="text-xs text-slate-400">{agoLabel(createdAt)}</p>
    </div>
  )
}

interface ListPanelProps {
  tone: ListPanelTone
  icon: LucideIcon
  title: string
  subtitle: string
  /** The list's full screen, linked from the header. */
  viewAll: { to: string; label: string }
  /**
   * Shown when the list has nothing in it. The button is left off where an
   * empty list is good news — nothing unpaid is not something to add to.
   */
  empty: { title: string; description: string; action?: { to: string; label: string } }
  loading: boolean
  error: string | null
  onRetry: () => void
  /** The page's envelope, `null` until the first one comes back. */
  pagination: Pagination | null
  /** Rows on screen, for the "1–5 of 8" range. */
  count: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  /** The rows. Only drawn once there is at least one. */
  children: ReactNode
}

/**
 * The frame every dashboard list panel sits in: a header naming the list and
 * how many rows it has, the rows themselves, and the pages under them — with
 * the loading, failed and empty states drawn the same way for every list.
 */
export function ListPanel({
  tone,
  icon: Icon,
  title,
  subtitle,
  viewAll,
  empty,
  loading,
  error,
  onRetry,
  pagination,
  count,
  onPageChange,
  onLimitChange,
  children,
}: ListPanelProps) {
  const tones = TONES[tone]
  const firstLoad = loading && !pagination
  const total = pagination?.total ?? 0

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* Header */}
      <div
        className={cn(
          'flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r via-white to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
          tones.header,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm',
              tones.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
              {!firstLoad && !error && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', tones.badge)}>
                  {total}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <Link
          {...NEW_TAB}
          to={viewAll.to}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:self-auto"
        >
          {viewAll.label} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Body */}
      {error ? (
        <div className="flex flex-wrap items-center gap-3 px-5 py-6">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : firstLoad ? (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: PANEL_PAGE_SIZE }, (_, row) => (
            <div key={row} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-5 w-24 md:block" />
              <Skeleton className="hidden h-8 w-24 md:block" />
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span
            className={cn('mb-3 flex h-14 w-14 items-center justify-center rounded-full', tones.empty)}
          >
            <Icon className="h-7 w-7" />
          </span>
          <h3 className="text-sm font-semibold text-slate-900">{empty.title}</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500">{empty.description}</p>
          {empty.action && (
            <Link
              {...NEW_TAB}
              to={empty.action.to}
              className={cn(
                'mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                tones.button,
              )}
            >
              <Icon className="h-4 w-4" /> {empty.action.label}
            </Link>
          )}
        </div>
      ) : (
        <div className={cn('transition-opacity', loading && 'pointer-events-none opacity-60')}>
          {children}
        </div>
      )}

      {/* Paging */}
      {pagination && !error && total > 0 && (
        <div className="border-t border-slate-100 px-4 pb-4 sm:px-5 [&>div]:mt-3">
          <PaginationBar
            pagination={pagination}
            count={count}
            pageSizes={PANEL_PAGE_SIZES}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            disabled={loading}
          />
        </div>
      )}
    </section>
  )
}
