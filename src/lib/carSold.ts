import type { UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import type { ApiError } from '@/services/httpClient'
import { formatDayMonthYear } from '@/lib/utils'
import { sellingPriceLabel, toDateInput } from '@/lib/carSelling'
import type {
  CarSellingOption,
  CarSoldCustomerRecord,
  CarSoldDeliveredStatus,
  CreateCarSoldCustomerPayload,
  SoldCarRecord,
  UpdateCarSoldCustomerPayload,
} from '@/types/carSold'

/** The two answers the desk has: the buyer took the car, or has not yet. */
export const DELIVERED_STATUS_OPTIONS: { label: string; value: CarSoldDeliveredStatus }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Delivered', value: 'DELIVERED' },
]

/** "Delivered" / "Pending" — the stored value put back into words. */
export function deliveredStatusLabel(status: CarSoldDeliveredStatus | null | undefined): string {
  return DELIVERED_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? '—'
}

/**
 * How a sale's money reads. A `PARTIAL` sale with nothing against it has not
 * been part paid at all, and saying so beats calling 0 a part payment.
 */
export function paymentStatusLabel(sale: CarSoldCustomerRecord): string {
  if (sale.paymentStatus === 'PAID') return 'Paid'
  return sale.paidAmount > 0 ? 'Partial' : 'Nothing paid'
}

/** True while there is still money owing — the rows that offer Collect. */
export function isPartlyPaid(sale: CarSoldCustomerRecord | null | undefined): boolean {
  return Boolean(sale) && sale!.paymentStatus === 'PARTIAL'
}

/** `₹4,00,000`, or `—` when there is no figure to show. */
export function amountLabel(amount: number | null | undefined): string {
  return sellingPriceLabel(amount) ?? '—'
}

/** "Maruti Suzuki Hatchback", falling back to whichever half is known. */
export function soldCarTitle(car: SoldCarRecord): string {
  return [car.companyName, car.carType].filter(Boolean).join(' ') || 'Car details not added'
}

/** "GJ01AB1234 · SUV", or just the number while no body type is recorded. */
export function carOptionLabel(option: CarSellingOption): string {
  return [option.carNumber, option.carType].filter(Boolean).join(' · ')
}

/**
 * The cars on the picker matching what was typed — number or body type, those
 * whose number starts with it first. Blank offers them all.
 */
export function filterCarOptions(
  options: CarSellingOption[],
  typed: string,
): CarSellingOption[] {
  const term = typed.trim().toLowerCase()
  if (!term) return options

  // A number is searched the way it is stored: "gj 01-ab" finds "GJ01AB1234".
  const plain = term.replace(/[^a-z0-9]/g, '')

  const starts: CarSellingOption[] = []
  const contains: CarSellingOption[] = []
  for (const option of options) {
    const number = option.carNumber.toLowerCase()
    const type = (option.carType ?? '').toLowerCase()

    if (plain && number.startsWith(plain)) starts.push(option)
    else if ((plain && number.includes(plain)) || type.includes(term)) contains.push(option)
  }
  return [...starts, ...contains]
}

/**
 * `23-Sep-2026` from the API's `2026-09-23T00:00:00.000Z`. A DATE comes back at
 * midnight UTC, so only the date part is read — converting it through local
 * time would move it a day back west of Greenwich.
 */
export function carSoldDateLabel(value: string | null | undefined): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '')
  if (!match) return null
  const [year, month, day] = match[1].split('-').map(Number)
  return formatDayMonthYear(new Date(year, month - 1, day))
}

/** The sale form's fields, all held as they are typed. */
export interface CarSoldFormValues {
  /** The listing's id — what the URL of the POST is built from. */
  carSellingId: string
  finalSellingPrice: string
  purchaseOwnerName: string
  purchaseOwnerMobileNo: string
  purchaseOwnerAddress: string
  deliveredStatus: CarSoldDeliveredStatus
  /** `YYYY-MM-DD`; only asked for, and only sent, on a delivered sale. */
  deliveredDate: string
  /** What was taken at the counter, if anything. Becomes the first receipt. */
  paymentAmount: string
}

export const EMPTY_CAR_SOLD_FORM: CarSoldFormValues = {
  carSellingId: '',
  finalSellingPrice: '',
  purchaseOwnerName: '',
  purchaseOwnerMobileNo: '',
  purchaseOwnerAddress: '',
  deliveredStatus: 'PENDING',
  deliveredDate: '',
  paymentAmount: '',
}

/** True once what was taken covers the price — the sale is then `PAID`. */
export function paysOffThePrice(values: {
  paymentAmount: string
  finalSellingPrice: string
}): boolean {
  const paid = Number(values.paymentAmount.trim())
  const price = Number(values.finalSellingPrice.trim())
  return Boolean(paid) && Boolean(price) && paid >= price
}

/**
 * Blank optional fields are left out entirely rather than sent empty, and the
 * delivered date only goes out on a sale marked Delivered — the API refuses a
 * date on a Pending one.
 */
export function toCreateCarSoldPayload(
  values: CarSoldFormValues,
): CreateCarSoldCustomerPayload {
  const address = values.purchaseOwnerAddress.trim()
  const payment = values.paymentAmount.trim()
  const deliveredDate =
    values.deliveredStatus === 'DELIVERED' ? values.deliveredDate.trim() : ''

  return {
    // Required on the form, so always there by the time it is sent.
    finalSellingPrice: Number(values.finalSellingPrice.trim()),
    purchaseOwnerName: values.purchaseOwnerName.trim(),
    purchaseOwnerMobileNo: values.purchaseOwnerMobileNo.trim(),
    ...(address ? { purchaseOwnerAddress: address } : {}),
    deliveredStatus: values.deliveredStatus,
    ...(deliveredDate ? { deliveredDate } : {}),
    ...(payment ? { paymentAmount: Number(payment) } : {}),
  }
}

/** A recorded sale put back into the form's shape, for editing it. */
export function carSoldFormValues(sale: CarSoldCustomerRecord): CarSoldFormValues {
  return {
    carSellingId: sale.carSellingId,
    finalSellingPrice: String(sale.finalSellingPrice),
    purchaseOwnerName: sale.purchaseOwnerName,
    purchaseOwnerMobileNo: sale.purchaseOwnerMobileNo,
    purchaseOwnerAddress: sale.purchaseOwnerAddress ?? '',
    deliveredStatus: sale.deliveredStatus,
    deliveredDate: toDateInput(sale.deliveredDate),
    // Money is not edited — later receipts go through Collect.
    paymentAmount: '',
  }
}

/**
 * The whole sale as the form holds it. Sending every field keeps the edit
 * simple and is harmless: an unchanged value is stored as it already is. An
 * emptied address goes as `''`, which the API stores as no address.
 */
export function toUpdateCarSoldPayload(
  values: CarSoldFormValues,
): UpdateCarSoldCustomerPayload {
  const deliveredDate =
    values.deliveredStatus === 'DELIVERED' ? values.deliveredDate.trim() : ''

  return {
    finalSellingPrice: Number(values.finalSellingPrice.trim()),
    purchaseOwnerName: values.purchaseOwnerName.trim(),
    purchaseOwnerMobileNo: values.purchaseOwnerMobileNo.trim(),
    purchaseOwnerAddress: values.purchaseOwnerAddress.trim(),
    deliveredStatus: values.deliveredStatus,
    ...(deliveredDate ? { deliveredDate } : {}),
  }
}

const CAR_SOLD_FORM_FIELDS: string[] = Object.keys(EMPTY_CAR_SOLD_FORM)

/** Puts a 400's per-field messages back on the fields that caused them. */
export function applyCarSoldApiError(
  error: ApiError,
  setError: UseFormSetError<CarSoldFormValues>,
  setFocus: UseFormSetFocus<CarSoldFormValues>,
): void {
  const rejected = error.fieldErrors.filter((e) => CAR_SOLD_FORM_FIELDS.includes(e.field))

  for (const { field, message } of rejected) {
    setError(field as keyof CarSoldFormValues, { type: 'server', message })
  }

  if (rejected[0]) setFocus(rejected[0].field as keyof CarSoldFormValues)
}

/** How far through paying a sale is, 0 to 100 — for the progress strip. */
export function paidPercent(sale: CarSoldCustomerRecord): number {
  if (sale.finalSellingPrice <= 0) return 0
  const percent = (sale.paidAmount / sale.finalSellingPrice) * 100
  return Math.max(0, Math.min(100, Math.round(percent)))
}
