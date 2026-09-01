import type { Tone } from '@/components/ui/Badge'
import type { JobLineItem, JobStatus } from '@/types'
import type { JobCardStatus } from '@/types/jobCard'

/**
 * What the job card form offers. `JobStatus` still carries the two further
 * states an older card can be in, so the list and the badges keep reading them
 * — they are simply not something the desk sets here.
 */
export const JOB_STATUS_OPTIONS: { label: string; value: JobStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
]

/** The dot shown beside the status picker, in the badge's own colours. */
export const JOB_STATUS_DOT: Record<JobStatus, string> = {
  pending: 'bg-amber-500',
  'in-progress': 'bg-sky-500',
  completed: 'bg-primary-600',
  delivered: 'bg-emerald-500',
}

/**
 * What the desk calls a vehicle: the make and model when the API has them,
 * falling back through the type to the number itself, so a sparsely filled row
 * still reads as something. `description` is deliberately not in that chain —
 * it carries the customer's complaint, not the name of the car.
 */
export function vehicleDisplayName(vehicle: {
  brand?: string | null
  model?: string | null
  variant?: string | null
  vehicleType?: string | null
  vehicleNumber?: string | null
}): string {
  const built = [vehicle.brand, vehicle.model, vehicle.variant]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')

  return built || vehicle.vehicleType?.trim() || vehicle.vehicleNumber?.trim() || ''
}

export function itemAmount(item: Pick<JobLineItem, 'qty' | 'rate'>): number {
  return item.qty * item.rate
}

export interface JobCardTotals {
  subtotal: number
  /** The discount actually applied — never more than the bill itself. */
  discount: number
  total: number
}

/** No tax is added: what the job comes to is the work less the discount. */
export function calculateTotals(items: JobLineItem[], discount: number): JobCardTotals {
  const subtotal = items.reduce((sum, item) => sum + itemAmount(item), 0)
  const applied = Math.min(Math.max(Number.isFinite(discount) ? discount : 0, 0), subtotal)
  return { subtotal, discount: applied, total: roundPaise(subtotal - applied) }
}

function roundPaise(value: number): number {
  return Math.round(value * 100) / 100
}

/** Job-card money always carries paise — these amounts are edited, not just read. */
export function formatAmount(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatMoney(value: number): string {
  return `₹${formatAmount(value)}`
}

/** `yyyy-mm-dd` in local time, which is what `<input type="date">` expects. */
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Keeps only digits, so an odometer reading stays a number while typed. */
export function normalizeKmInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 7)
}

/** A blank line item, ready to be filled in by the item dialog. */
export function emptyJobItem(): Omit<JobLineItem, 'id'> {
  return { description: '', qty: 1, rate: 0 }
}

/**
 * The API's own status vocabulary, which is uppercased and underscored where
 * the local `JobStatus` is hyphenated and lowercase.
 */
const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
}

/** The picker's value as the API spells it. */
const TO_JOB_CARD_STATUS: Record<JobStatus, JobCardStatus> = {
  pending: 'PENDING',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED',
  delivered: 'DELIVERED',
}

/** What the desk picked, ready to be posted with the card. */
export function toJobCardStatus(status: JobStatus): JobCardStatus {
  return TO_JOB_CARD_STATUS[status] ?? 'PENDING'
}

/** The API's status as the picker holds it, for a card being edited. */
export function fromJobCardStatus(status: JobCardStatus): JobStatus {
  const found = (Object.keys(TO_JOB_CARD_STATUS) as JobStatus[]).find(
    (key) => TO_JOB_CARD_STATUS[key] === status,
  )
  return found ?? 'pending'
}

const JOB_CARD_STATUS_TONES: Record<JobCardStatus, Tone> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'primary',
  DELIVERED: 'success',
}

/** Falls back to the raw value, so a status added by the API still reads. */
export function jobCardStatusLabel(status: JobCardStatus): string {
  return JOB_CARD_STATUS_LABELS[status] ?? status
}

export function jobCardStatusTone(status: JobCardStatus): Tone {
  return JOB_CARD_STATUS_TONES[status] ?? 'neutral'
}

/** `31 Aug 2026` — the service date as the desk reads it. */
export function formatServiceDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
