import type { Tone } from '@/components/ui/Badge'
import type { ExportColumn } from '@/lib/excel'
import { paymentStatusLabel } from '@/lib/payment'
import { formatDayMonthYear } from '@/lib/utils'
import type { JobLineItem, JobStatus } from '@/types'
import type { JobCardRecord, JobCardStatus } from '@/types/jobCard'

/** One choice in the status picker. */
export interface JobStatusOption {
  label: string
  value: JobStatus
  /** Named in the list, but not the desk's to choose here. */
  disabled?: boolean
}

/**
 * The two states the desk talks a job card in, and the only two the API holds:
 * work still in hand, or the vehicle gone back out.
 */
const JOB_STATUS_OPTIONS: JobStatusOption[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Delivered', value: 'delivered' },
]

/**
 * What the status picker offers, for a new card or one being edited.
 *
 * Both states are always named, but Delivered can only be *chosen* while
 * editing: `POST /auth/jobcard` takes no status at all and opens every card as
 * PENDING, so offering it on a new card would be a choice the save quietly
 * threw away. `PUT /auth/jobcard/:id` does take one — and stamps the card's
 * completionDate from it — which is where the desk marks the vehicle as having
 * gone back out.
 */
export function jobStatusOptions(isEdit: boolean): JobStatusOption[] {
  if (isEdit) return JOB_STATUS_OPTIONS

  return JOB_STATUS_OPTIONS.map((option) =>
    option.value === 'pending' ? option : { ...option, disabled: true },
  )
}

/** The dot shown beside the status picker, in the badge's own colours. */
export const JOB_STATUS_DOT: Record<JobStatus, string> = {
  pending: 'bg-amber-500',
  'in-progress': 'bg-sky-500',
  completed: 'bg-primary-600',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

/**
 * The picker's own text, in the colour of its dot — so Delivered reads green
 * in the form the same way its badge does on the list, rather than in the
 * primary colour every other field is drawn in.
 */
export const JOB_STATUS_TEXT: Record<JobStatus, string> = {
  pending: 'text-amber-700',
  'in-progress': 'text-sky-700',
  completed: 'text-primary-700',
  delivered: 'text-emerald-700',
  cancelled: 'text-red-700',
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
 * What the desk calls each of the API's statuses, which are uppercased where
 * the local `JobStatus` is lowercase.
 */
const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  PENDING: 'Pending',
  DELIVERED: 'Delivered',
}

/**
 * The picker's value as the API spells it.
 *
 * `JobStatus` is the wider vocabulary the mock screens still speak; only the
 * two states the API actually holds are mapped, and `toJobCardStatus` falls
 * back to PENDING for anything else rather than sending a word the API would
 * turn away with a 400.
 */
const TO_JOB_CARD_STATUS: Partial<Record<JobStatus, JobCardStatus>> = {
  pending: 'PENDING',
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

/**
 * Amber while the card is still work in hand, green once the vehicle has gone
 * back out — so the two never read as the same colour at a glance.
 */
const JOB_CARD_STATUS_TONES: Record<JobCardStatus, Tone> = {
  PENDING: 'warning',
  DELIVERED: 'success',
}

/** Falls back to the raw value, so a status added by the API still reads. */
export function jobCardStatusLabel(status: JobCardStatus): string {
  return JOB_CARD_STATUS_LABELS[status] ?? status
}

export function jobCardStatusTone(status: JobCardStatus): Tone {
  return JOB_CARD_STATUS_TONES[status] ?? 'neutral'
}

/** `31-Aug-2026` — the service date as the desk reads it. */
export function formatServiceDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return formatDayMonthYear(date)
}

/**
 * A date for a spreadsheet cell, which is not quite the date for a screen: a
 * card that has not been delivered has no completion date, and an em dash in
 * that cell would be a value to filter and sort around. It is left empty.
 */
function sheetDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : formatDayMonthYear(date)
}

/**
 * One row per job card, for the Excel export on both screens that list them —
 * the garage's own Job Cards page and the admin's window onto one garage.
 *
 * Defined once here because the two lists hold exactly the same record and a
 * second copy of these columns would drift. A card's billable lines are folded
 * into one cell rather than given a row each: the sheet is a list OF CARDS, and
 * one card spread over three rows would break every count and total in it. The
 * line count and the card total come along so the detail is still summarised.
 *
 * Money and counts are written as numbers, not as `₹1,234.00` strings, so the
 * sheet can sort, filter and total the columns — which is the point of
 * exporting to Excel rather than printing.
 */
export const JOB_CARD_EXPORT_COLUMNS: ExportColumn<JobCardRecord>[] = [
  { header: 'Job No.', value: (job) => job.jobNumber, align: 'left', width: 16 },
  { header: 'Service Date', value: (job) => sheetDate(job.serviceDate), align: 'center', width: 14 },
  { header: 'Status', value: (job) => jobCardStatusLabel(job.status), align: 'center', width: 12 },
  {
    header: 'Payment Status',
    value: (job) => paymentStatusLabel(job.paymentStatus),
    align: 'center',
    width: 15,
  },
  { header: 'Customer Name', value: (job) => job.vehicle?.customer?.fullName, width: 22 },
  {
    header: 'Customer Mobile',
    value: (job) => job.vehicle?.customer?.mobileNumber,
    align: 'left',
    width: 16,
  },
  { header: 'Vehicle Number', value: (job) => job.vehicle?.vehicleNumber, align: 'left', width: 18 },
  {
    header: 'Vehicle',
    value: (job) => (job.vehicle ? vehicleDisplayName(job.vehicle) : ''),
    width: 22,
  },
  { header: 'Vehicle Type', value: (job) => job.vehicle?.vehicleType, width: 14 },
  { header: 'Current KM', value: (job) => job.vehicle?.currentKm, align: 'right', width: 12 },
  { header: 'Complaint', value: (job) => job.vehicle?.description, wrap: true, width: 32 },
  { header: 'Assigned To', value: (job) => job.assignedStaff?.name, width: 20 },
  {
    header: 'Staff Role',
    value: (job) => job.assignedStaff?.role || job.assignedStaff?.category,
    width: 18,
  },
  {
    header: 'Items',
    value: (job) => (job.items ?? []).map((item) => item.description).join(', '),
    wrap: true,
    width: 34,
  },
  { header: 'Items Count', value: (job) => job.items?.length ?? 0, align: 'right', width: 12 },
  { header: 'Total Amount', value: (job) => Number(job.totalAmount) || 0, align: 'right', width: 14 },
  {
    header: 'Completion Date',
    value: (job) => sheetDate(job.completionDate),
    align: 'center',
    width: 16,
  },
]


