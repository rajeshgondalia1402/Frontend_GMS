import type { SubscriptionStatus } from '@/types'
import type { AuthSubscription } from '@/types/auth'

const DAY_MS = 24 * 60 * 60 * 1000

/** Local midnight of the day `value` falls on. */
function startOfDay(value: number | string | Date): number {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * Whole calendar days from `from` to `to`.
 *
 * Counting calendar days rather than raw elapsed time is what makes the number
 * behave the way people expect: it drops by one at midnight, not at whatever
 * time of day the account happened to be created. `Math.round` absorbs the
 * 23- and 25-hour days that daylight-saving changes produce.
 */
export function daysBetween(from: number | string | Date, to: number | string | Date): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS)
}

/** Calendar days left until `date` (0 once it has passed). */
export function daysUntil(date: string, now: number = Date.now()): number {
  const end = Date.parse(date)
  if (Number.isNaN(end)) return 0
  return Math.max(0, daysBetween(now, end))
}

export interface SubscriptionView {
  status: SubscriptionStatus
  /** Days left, derived from the subscription's `endDate`. */
  daysRemaining: number
  /** Full length of the plan, derived from `startDate` -> `endDate`. */
  totalDays: number
  /** Days already elapsed since `startDate`. */
  daysUsed: number
  /** `daysUsed / totalDays`, clamped to 0–1, for the progress bar. */
  progress: number
  /** Display name of the plan, e.g. `FREE_TRIAL` -> `Free Trial`. */
  planLabel: string
  /** `endDate` formatted for display, or `null` when unparseable. */
  endDateLabel: string | null
  startDateLabel: string | null
}

/** `FREE_TRIAL` -> `Free Trial`, `PREMIUM` -> `Premium`. */
function toPlanLabel(plan: string): string {
  return plan
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const EMPTY_VIEW: SubscriptionView = {
  status: 'expired',
  daysRemaining: 0,
  totalDays: 0,
  daysUsed: 0,
  progress: 1,
  planLabel: 'No Plan',
  endDateLabel: null,
  startDateLabel: null,
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Formats an ISO date as `13 Sep 2026`; `null` when it cannot be parsed.
 * Built by hand rather than via `toLocaleDateString`, whose short month name
 * varies with the browser ICU build ("Sep" vs "Sept").
 */
export function formatSubscriptionDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return null

  const date = new Date(parsed)
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** `1 day` / `12 days` — avoids "1 days remaining". */
export function formatDayCount(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

/**
 * Maps the API subscription onto the visual states shared by the dashboard
 * banner and the topbar pill, so both always agree.
 *
 * Every number comes from the `startDate` / `endDate` the API stored when the
 * account was registered — nothing here assumes a 30-day plan.
 */
export function getSubscriptionView(
  subscription: AuthSubscription | null,
  now: number = Date.now(),
): SubscriptionView {
  if (!subscription) return EMPTY_VIEW

  const planLabel = toPlanLabel(subscription.plan)
  const daysRemaining = daysUntil(subscription.endDate, now)

  const startParsed = Date.parse(subscription.startDate)
  const endParsed = Date.parse(subscription.endDate)
  const totalDays =
    Number.isNaN(startParsed) || Number.isNaN(endParsed)
      ? 0
      : Math.max(0, daysBetween(startParsed, endParsed))

  const daysUsed = Math.min(totalDays, Math.max(0, totalDays - daysRemaining))
  const progress = totalDays > 0 ? Math.min(1, Math.max(0, daysUsed / totalDays)) : 1

  const dates = {
    planLabel,
    totalDays,
    daysUsed,
    progress,
    endDateLabel: formatSubscriptionDate(subscription.endDate),
    startDateLabel: formatSubscriptionDate(subscription.startDate),
  }

  if (subscription.status !== 'ACTIVE' || daysRemaining <= 0) {
    return { ...dates, status: 'expired', daysRemaining: 0, daysUsed: totalDays, progress: 1 }
  }
  if (daysRemaining <= 7) return { ...dates, status: 'expiring', daysRemaining }

  return {
    ...dates,
    status: subscription.plan === 'FREE_TRIAL' ? 'trial' : 'active',
    daysRemaining,
  }
}
