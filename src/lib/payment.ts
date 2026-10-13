import { Banknote, CreditCard, HandCoins, Landmark, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Tone } from '@/components/ui/Badge'
import { formatDayMonthYear } from '@/lib/utils'
import type { JobPaymentStatus } from '@/types/jobCard'
import type { PaymentMethod, PaymentRecord } from '@/types/payment'

/** One way of taking money, as the desk picks it. */
export interface PaymentMethodOption {
  value: PaymentMethod
  label: string
  icon: LucideIcon
  /** The tile's colours while it is the chosen one. */
  accent: string
}

/**
 * The row of tiles on the payment screen, in the order a garage reaches for
 * them. `CREDIT_DUE` sits last and is deliberately a real method rather than a
 * way of skipping the bill: the API counts it towards what has been paid like
 * any other receipt, so taking the whole balance as Credit / Due settles the
 * card and marks the vehicle delivered.
 */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote, accent: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { value: 'UPI', label: 'UPI', icon: Smartphone, accent: 'border-violet-500 bg-violet-50 text-violet-700' },
  { value: 'CARD', label: 'Card', icon: CreditCard, accent: 'border-sky-500 bg-sky-50 text-sky-700' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Landmark, accent: 'border-amber-500 bg-amber-50 text-amber-700' },
  { value: 'CREDIT_DUE', label: 'Credit / Due', icon: HandCoins, accent: 'border-rose-500 bg-rose-50 text-rose-700' },
]

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_DUE: 'Credit / Due',
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  CASH: Banknote,
  UPI: Smartphone,
  CARD: CreditCard,
  BANK_TRANSFER: Landmark,
  CREDIT_DUE: HandCoins,
}

/** Falls back to the raw value, so a method added by the API still reads. */
export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

export function paymentMethodIcon(method: PaymentMethod): LucideIcon {
  return PAYMENT_METHOD_ICONS[method] ?? Banknote
}

const PAYMENT_STATUS_LABELS: Record<JobPaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial Paid',
  PAID: 'Paid',
}

/**
 * Red while nothing has been collected, amber with a balance still owing, green
 * once the bill is settled — the same three-step reading the progress bar gives.
 */
const PAYMENT_STATUS_TONES: Record<JobPaymentStatus, Tone> = {
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'success',
}

export function paymentStatusLabel(status: JobPaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status] ?? status
}

export function paymentStatusTone(status: JobPaymentStatus): Tone {
  return PAYMENT_STATUS_TONES[status] ?? 'neutral'
}

/** How much of the bill is in, 0–100, for the balance bar. */
export function paidPercent(paidAmount: number, totalAmount: number): number {
  if (!(totalAmount > 0)) return 0
  return Math.min(100, Math.max(0, Math.round((paidAmount / totalAmount) * 100)))
}

/** The bar's fill, in the tone the status badge is already wearing. */
export function paidBarClass(status: JobPaymentStatus): string {
  if (status === 'PAID') return 'bg-emerald-500'
  return status === 'PARTIAL' ? 'bg-amber-500' : 'bg-slate-300'
}

/**
 * `07-Sept-2026, 2:50 pm` — a receipt is a moment, not a day, so the time is
 * part of how it reads. The date half matches every other date on these
 * screens. An unparseable value is handed back as it came.
 */
export function formatPaymentDate(value: string | null | undefined): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const time = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `${formatDayMonthYear(date)}, ${time}`
}

/** Paise-accurate, so a running total does not drift a hundredth off. */
function roundPaise(value: number): number {
  return Math.round(value * 100) / 100
}

/** One receipt with what was still owing the moment it was taken. */
export interface PaymentWithBalance {
  payment: PaymentRecord
  /** The bill less everything collected up to and including this one. */
  balanceAfter: number
}

/**
 * The receipts with a running balance against each — the reading a customer
 * asks for when a bill was settled over several visits: what went in, when,
 * and what was left after each.
 *
 * Oldest first, which is the order the API lists them in and the only order
 * a running balance makes sense in. A `paymentDate` is used to sort where one
 * was corrected out of order.
 */
export function paymentsWithBalance(
  payments: PaymentRecord[],
  totalAmount: number,
): PaymentWithBalance[] {
  let collected = 0

  return [...payments]
    .sort((a, b) => Date.parse(a.paymentDate) - Date.parse(b.paymentDate))
    .map((payment) => {
      collected = roundPaise(collected + payment.amount)
      return { payment, balanceAfter: Math.max(0, roundPaise(totalAmount - collected)) }
    })
}

/**
 * Money as the amount box holds it: two decimals, no grouping and no symbol, so
 * what is prefilled can be typed over and posted back unchanged.
 */
export function toAmountInputValue(value: number): string {
  return value > 0 ? value.toFixed(2) : ''
}

/**
 * What the desk typed, as paise-accurate a number as the API will take.
 * `NaN` for anything that is not a number at all, which the form reports.
 */
export function parseAmountInput(value: string): number {
  return Math.round(Number(value.trim()) * 100) / 100
}
