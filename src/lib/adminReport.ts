import type { Tone } from '@/components/ui/Badge'
import { formatDayCount } from '@/lib/subscription'
import { formatCurrency } from '@/lib/utils'
import type {
  GarageReportParams,
  GarageReportSubscription,
  SubscriptionPlan,
  SubscriptionRecordStatus,
} from '@/types/admin'

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE_TRIAL: 'Free Trial',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
}

const PLAN_TONES: Record<SubscriptionPlan, Tone> = {
  FREE_TRIAL: 'info',
  MONTHLY: 'primary',
  YEARLY: 'success',
}

/** Falls back to the raw value, so a plan added by the API still reads. */
export function planLabel(plan: SubscriptionPlan): string {
  return PLAN_LABELS[plan] ?? plan
}

export function planTone(plan: SubscriptionPlan): Tone {
  return PLAN_TONES[plan] ?? 'neutral'
}

/** `Free` for a zero-priced plan, otherwise the rupee amount. */
export function planPriceLabel(price: number | null | undefined): string {
  const amount = Number(price)
  if (!Number.isFinite(amount) || amount <= 0) return 'Free'
  return formatCurrency(amount)
}

/** `?plan=` dropdown; the empty value leaves the filter off. */
export const PLAN_FILTER_OPTIONS = [
  { label: 'All plans', value: '' },
  ...(Object.keys(PLAN_LABELS) as SubscriptionPlan[]).map((plan) => ({
    label: planLabel(plan),
    value: plan as string,
  })),
]

const STATUS_LABELS: Record<SubscriptionRecordStatus, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
}

/** `?status=` dropdown — the stored column, not the date-derived state. */
export const STATUS_FILTER_OPTIONS = [
  { label: 'Any stored status', value: '' },
  ...(Object.keys(STATUS_LABELS) as SubscriptionRecordStatus[]).map((status) => ({
    label: STATUS_LABELS[status],
    value: status as string,
  })),
]

/** How far ahead the "Expiring soon" pill looks — the API's own window. */
export const EXPIRING_SOON_DAYS = 7

/**
 * The pills above the list, built on the **derived** state so they agree with
 * the badge on each row. Each maps onto the query params it stands for.
 */
export const STATE_FILTERS: {
  label: string
  value: string
  params: Pick<GarageReportParams, 'expired' | 'expiringInDays'>
}[] = [
  { label: 'All', value: 'all', params: {} },
  { label: 'Live', value: 'live', params: { expired: false } },
  {
    label: `Expiring in ${EXPIRING_SOON_DAYS} days`,
    value: 'expiring',
    params: { expiringInDays: EXPIRING_SOON_DAYS },
  },
  { label: 'Expired', value: 'expired', params: { expired: true } },
]

/**
 * One badge per row. A cancelled subscription says so whatever its dates are;
 * otherwise the end date decides, since a stored `ACTIVE` can be out of date.
 */
export function subscriptionBadge(sub: GarageReportSubscription): { label: string; tone: Tone } {
  if (sub.status === 'CANCELLED') return { label: 'Cancelled', tone: 'neutral' }
  if (sub.isExpired) return { label: 'Expired', tone: 'danger' }
  if (sub.expiringSoon) return { label: 'Expiring soon', tone: 'warning' }
  return { label: 'Active', tone: 'success' }
}

/** `12 days left`, `Ends today`, `Expired 3 days ago`, `Expired today`. */
export function daysLeftLabel(sub: GarageReportSubscription): string {
  if (sub.isExpired) {
    return sub.expiredDaysAgo > 0
      ? `Expired ${formatDayCount(sub.expiredDaysAgo)} ago`
      : 'Expired today'
  }
  return sub.pendingDays > 0 ? `${formatDayCount(sub.pendingDays)} left` : 'Ends today'
}

/** Text colour for the days-left figure, matching the badge. */
export function daysLeftClass(sub: GarageReportSubscription): string {
  if (sub.isExpired) return 'text-red-600'
  if (sub.expiringSoon) return 'text-amber-600'
  return 'text-slate-700'
}
