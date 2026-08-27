import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pagination } from '@/types/auth'

/** The page sizes offered before "All". */
const PAGE_SIZES = [10, 25, 50, 100]

/** The default, and what a list falls back to. */
export const DEFAULT_PAGE_SIZE = 10

/**
 * The page numbers to draw: always the first and last, the current one with a
 * neighbour either side, and a gap wherever a run was skipped.
 */
function pageItems(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = new Set([1, totalPages, current, current - 1, current + 1])
  const shown = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const items: (number | 'gap')[] = []
  shown.forEach((page, i) => {
    if (i > 0 && page - (shown[i - 1] as number) > 1) items.push('gap')
    items.push(page)
  })

  return items
}

interface PaginationBarProps {
  pagination: Pagination
  /** How many rows are actually on screen — the end of the "showing" range. */
  count: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  /** Largest page size the API will honour; caps the "All" option. */
  maxLimit?: number
  disabled?: boolean
}

/**
 * Page numbers, a rows-per-page picker and the range being shown. The page
 * size is part of the query, so changing it is the list's caller's business —
 * this only reports the choice.
 */
export function PaginationBar({
  pagination,
  count,
  onPageChange,
  onLimitChange,
  maxLimit,
  disabled = false,
}: PaginationBarProps) {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = pagination

  const first = total === 0 ? 0 : (page - 1) * limit + 1
  const last = total === 0 ? 0 : first + count - 1

  // "All" asks for exactly as many rows as there are, within what the API takes.
  const allLimit = Math.max(DEFAULT_PAGE_SIZE, maxLimit ? Math.min(total, maxLimit) : total)
  const sizes = PAGE_SIZES.filter((size) => !maxLimit || size <= maxLimit)
  const options = [
    ...sizes.map((size) => ({ label: String(size), value: String(size) })),
    { label: 'All', value: String(allLimit) },
  ]
  // A size the picker does not list (an "All" that is now a different total)
  // would otherwise leave the control blank.
  const selected = options.some((o) => o.value === String(limit)) ? String(limit) : String(allLimit)

  const step = (to: number) => () => onPageChange(to)

  const arrowClass =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <label htmlFor="page-size" className="whitespace-nowrap">
          Rows per page
        </label>
        <select
          id="page-size"
          value={selected}
          disabled={disabled}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap">
          {first}–{last} of {total}
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            className={arrowClass}
            disabled={disabled || !hasPreviousPage}
            onClick={step(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageItems(page, totalPages).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? 'page' : undefined}
                disabled={disabled}
                onClick={step(item)}
                className={cn(
                  'h-9 min-w-9 rounded-lg px-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed',
                  item === page
                    ? 'bg-primary-600 text-white'
                    : 'border border-slate-300 text-slate-600 hover:bg-slate-100',
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label="Next page"
            className={arrowClass}
            disabled={disabled || !hasNextPage}
            onClick={step(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
