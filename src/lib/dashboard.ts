import type { DashboardMonth } from '@/types/dashboard'

/**
 * `September 2026` — the month the "this month" figures were counted over,
 * for the heading above them.
 *
 * Read off the window's **end**, which is the moment the summary was taken.
 * The start is midnight on the 1st in the server's own timezone, and that
 * instant can fall in the previous month once a browser somewhere else in the
 * world writes it out; the end never does.
 */
export function monthLabel(month: DashboardMonth | null | undefined): string {
  const taken = month?.endDate ? new Date(month.endDate) : null
  if (!taken || Number.isNaN(taken.getTime())) return 'This month'

  return taken.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

/** A count as the tiles write it: `1,25,000`, and a dash before it is known. */
export function formatCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-IN')
    : '—'
}
