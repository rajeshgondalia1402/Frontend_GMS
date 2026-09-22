import type { JobCardRecord, JobCardStatus, JobPaymentStatus } from '@/types/jobCard'

/**
 * The job card window's reading of a garage's cards.
 *
 * `GET /auth/jobcard` carries `paymentStatus` and `totalAmount` but not what
 * has actually been collected, so "settled" and "outstanding" are read off the
 * status: the billed value of the cards that are paid, and the billed value of
 * the ones that are not. The tiles are worded that way rather than as rupees in
 * hand, which only the payment endpoint could say.
 */
export interface JobCardSummary {
  /** Cards in the garage, over every page. */
  total: number
  /** What those cards add up to. */
  billed: number
  paidCount: number
  paidValue: number
  partialCount: number
  partialValue: number
  unpaidCount: number
  unpaidValue: number
  /** Partly paid and unpaid together — every card still owing something. */
  outstandingCount: number
  outstandingValue: number
  pending: number
  delivered: number
}

/** Paise-accurate, so a column of totals does not drift a hundredth off. */
function roundPaise(value: number): number {
  return Math.round(value * 100) / 100
}

export function summariseJobCards(cards: JobCardRecord[]): JobCardSummary {
  const summary: JobCardSummary = {
    total: cards.length,
    billed: 0,
    paidCount: 0,
    paidValue: 0,
    partialCount: 0,
    partialValue: 0,
    unpaidCount: 0,
    unpaidValue: 0,
    outstandingCount: 0,
    outstandingValue: 0,
    pending: 0,
    delivered: 0,
  }

  for (const card of cards) {
    const amount = Number(card.totalAmount) || 0
    summary.billed += amount

    if (card.paymentStatus === 'PAID') {
      summary.paidCount += 1
      summary.paidValue += amount
    } else if (card.paymentStatus === 'PARTIAL') {
      summary.partialCount += 1
      summary.partialValue += amount
    } else {
      summary.unpaidCount += 1
      summary.unpaidValue += amount
    }

    if (card.status === 'DELIVERED') summary.delivered += 1
    else summary.pending += 1
  }

  summary.outstandingCount = summary.partialCount + summary.unpaidCount
  summary.outstandingValue = roundPaise(summary.partialValue + summary.unpaidValue)

  summary.billed = roundPaise(summary.billed)
  summary.paidValue = roundPaise(summary.paidValue)
  summary.partialValue = roundPaise(summary.partialValue)
  summary.unpaidValue = roundPaise(summary.unpaidValue)

  return summary
}

/** The payment chips, in the order an admin reads a garage's book. */
export const PAYMENT_FILTERS: { label: string; value: string }[] = [
  { label: 'All payments', value: 'all' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Unpaid', value: 'UNPAID' },
]

/** The two states a card can be in, and no third — the API holds no other. */
export const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All jobs', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Delivered', value: 'DELIVERED' },
]

/**
 * A vehicle number as it is stored: uppercase, no spaces or dashes. Typing the
 * number as it is printed on the plate — `gj 01-ab 1234` — still finds it, the
 * same way the API's own search does.
 */
function normalizeVehicleNumber(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

/**
 * One box over everything a row shows: the job number, the customer's name and
 * mobile, the vehicle's number, type, brand and model, the staff member on the
 * card and the descriptions of what was billed.
 *
 * Matched here rather than through `?search=` because this window holds every
 * card of the garage at once — filtering what is already loaded answers as it
 * is typed, and keeps the summary tiles counting the same set the list shows.
 */
export function matchesJobCardSearch(card: JobCardRecord, term: string): boolean {
  const needle = term.trim().toLowerCase()
  if (!needle) return true

  const vehicle = card.vehicle
  const fields = [
    card.jobNumber,
    vehicle?.customer?.fullName,
    vehicle?.customer?.mobileNumber,
    vehicle?.vehicleType,
    vehicle?.brand,
    vehicle?.model,
    card.assignedStaff?.name,
    ...(card.items ?? []).map((item) => item.description),
  ]

  if (fields.some((field) => field?.toLowerCase().includes(needle))) return true

  // The plate is matched on its own terms, so the spacing typed does not matter.
  const plate = vehicle?.vehicleNumber
  return Boolean(plate && normalizeVehicleNumber(plate).includes(normalizeVehicleNumber(term)))
}

/** What the window sorts by — read off the loaded cards, not off the API. */
export type JobCardSortField = 'jobNumber' | 'serviceDate' | 'customer' | 'totalAmount' | 'paymentStatus'

/** Unpaid first, because that is the end of the list an admin is looking for. */
const PAYMENT_ORDER: Record<JobPaymentStatus, number> = { UNPAID: 0, PARTIAL: 1, PAID: 2 }

/** Work still in hand before work that has gone back out. */
const STATUS_ORDER: Record<JobCardStatus, number> = { PENDING: 0, DELIVERED: 1 }

function sortValue(card: JobCardRecord, field: JobCardSortField): string | number {
  switch (field) {
    case 'jobNumber':
      return card.jobNumber ?? ''
    case 'serviceDate':
      return Date.parse(card.serviceDate) || 0
    case 'customer':
      return card.vehicle?.customer?.fullName?.toLowerCase() ?? ''
    case 'totalAmount':
      return Number(card.totalAmount) || 0
    case 'paymentStatus':
      return PAYMENT_ORDER[card.paymentStatus] ?? 3
  }
}

/** A copy, sorted — the fetched order is left alone so a reset can return to it. */
export function sortJobCards(
  cards: JobCardRecord[],
  field: JobCardSortField,
  order: 'asc' | 'desc',
): JobCardRecord[] {
  const direction = order === 'asc' ? 1 : -1

  return [...cards].sort((a, b) => {
    const left = sortValue(a, field)
    const right = sortValue(b, field)

    if (left === right) {
      // A stable second key, so two cards billed the same never swap places
      // between renders.
      return (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2)
    }

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction
    }

    return String(left).localeCompare(String(right)) * direction
  })
}
