import type { UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import type { ApiError } from '@/services/httpClient'
import { formatDayMonthYear } from '@/lib/utils'
import { normalizeVehicleNumber } from '@/lib/validation'
import type {
  CarSellingRecord,
  CreateCarSellingPayload,
  UpdateCarSellingPayload,
} from '@/types/carSelling'

/**
 * Body types for the searchable Car Name dropdown, as Indian listings name
 * them. A pick list only — the API takes any car type as free text.
 */
export const CAR_TYPES = [
  'Hatchback',
  'Premium Hatchback',
  'Sedan',
  'Compact Sedan',
  'SUV',
  'Compact SUV',
  'Micro SUV',
  'Crossover',
  'MUV',
  'MPV',
  'Coupe',
  'Convertible',
  'Station Wagon',
  'Pickup',
  'Van',
  'Minivan',
  'Luxury',
]

/**
 * Car makers for the searchable Company dropdown, A to Z — only brands whose
 * cars have been sold new in India. Brands that have since left (Ford,
 * Chevrolet, Fiat, Datsun, Daewoo, Opel…) stay listed: their cars are still
 * on Indian roads and come up for resale. Offered as a pick list only — the
 * API takes any company name, so an unlisted one can still be typed.
 */
export const CAR_COMPANIES = [
  'Aston Martin',
  'Audi',
  'Bajaj',
  'Bentley',
  'BMW',
  'BYD',
  'Chevrolet',
  'Citroen',
  'Daewoo',
  'Datsun',
  'DC Design',
  'Ferrari',
  'Fiat',
  'Force Motors',
  'Ford',
  'Hindustan Motors',
  'Honda',
  'Hyundai',
  'ICML',
  'Isuzu',
  'Jaguar',
  'Jeep',
  'Kia',
  'Lamborghini',
  'Land Rover',
  'Lexus',
  'Lotus',
  'Mahindra',
  'Mahindra Renault',
  'Maruti Suzuki',
  'Maserati',
  'McLaren',
  'Mercedes-Benz',
  'MG',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Opel',
  'Porsche',
  'Premier',
  'Renault',
  'Reva',
  'Rolls-Royce',
  'San Motors',
  'Skoda',
  'SsangYong',
  'Tata',
  'Tesla',
  'Toyota',
  'VinFast',
  'Volkswagen',
  'Volvo',
]

/**
 * What the car runs on, for the Fuel Type dropdown. The API stores the label
 * as it is sent, so these are both what is shown and what goes out.
 */
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Battery', 'CNG']

/** The same list, shaped for `<Select>`. */
export const fuelTypeOptions = FUEL_TYPES.map((fuel) => ({ label: fuel, value: fuel }))

/**
 * The entries of a pick list matching what was typed, those starting with it
 * first — typing "ma" offers Maruti Suzuki before Tata. Blank lists them all.
 */
export function filterSuggestions(list: string[], typed: string): string[] {
  const term = typed.trim().toLowerCase()
  if (!term) return list

  const starts: string[] = []
  const contains: string[] = []
  for (const entry of list) {
    const name = entry.toLowerCase()
    if (name.startsWith(term)) starts.push(entry)
    else if (name.includes(term)) contains.push(entry)
  }
  return [...starts, ...contains]
}

/** `1st`, `2nd`, `3rd`, `4th`, … `11th`, `12th`, `13th`, `21st`. */
export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffix}`
}

/** "1st Owner", or `null` when the number of owners was left blank. */
export function carOwnerLabel(owners: number | null | undefined): string | null {
  if (owners === null || owners === undefined) return null
  return `${ordinal(owners)} Owner`
}

/** The dropdown offers 1st to 5th owner — a resale car rarely has more. */
export const CAR_OWNER_CHOICES_MAX = 5

const ownerOption = (owners: number) => ({
  label: carOwnerLabel(owners) as string,
  value: String(owners),
})

/**
 * 1st to 5th owner. The API accepts up to 20, so a car already saved with
 * more keeps its own value as one extra option rather than opening blank.
 */
export function carOwnerOptions(current?: number | null) {
  const options = Array.from({ length: CAR_OWNER_CHOICES_MAX }, (_, i) => ownerOption(i + 1))
  if (current && current > CAR_OWNER_CHOICES_MAX) options.push(ownerOption(current))
  return options
}

/** `₹4,25,000`, or `null` while no price has been agreed. */
export function sellingPriceLabel(price: number | string | null | undefined): string | null {
  if (price === null || price === undefined || price === '') return null
  const amount = Number(price)
  if (!Number.isFinite(amount)) return null

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * `2027-05-20` from the API's `2027-05-20T00:00:00.000Z` — the column is a
 * DATE sent back at midnight UTC, so only the date part is read. Converting it
 * through local time would move it a day back west of Greenwich.
 */
export function toDateInput(value: string | null | undefined): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '')
  return match ? match[1] : ''
}

/** Today as `YYYY-MM-DD`, in local time — what a date input compares with. */
export function todayDateInput(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** `20-May-2027`, or `null` when no date is recorded. */
export function insuranceDateLabel(value: string | null | undefined): string | null {
  const date = toDateInput(value)
  if (!date) return null
  const [year, month, day] = date.split('-').map(Number)
  return formatDayMonthYear(new Date(year, month - 1, day))
}

/** True once the insurance's valid-until date is behind us. */
export function isInsuranceExpired(value: string | null | undefined): boolean {
  const date = toDateInput(value)
  return Boolean(date) && date < todayDateInput()
}

/** "Maruti Suzuki Hatchback", falling back to whichever half is known. */
export function carTitle(car: CarSellingRecord): string {
  return [car.companyName, car.carType].filter(Boolean).join(' ') || 'Car details not added'
}

/** The dialog's fields, all held as they are typed. */
export interface CarSellingFormValues {
  ownerName: string
  mobileNumber: string
  address: string
  yearOfVehicle: string
  carType: string
  companyName: string
  /** Uppercase with spaces and hyphens removed, as the API stores it. */
  carNumber: string
  carOwner: string
  carColor: string
  /** One of `FUEL_TYPES`; the form will not submit while it is blank. */
  fuelType: string
  sellingPrice: string
  description: string
  insurance: boolean
  /** `YYYY-MM-DD` from the date picker; only asked for while `insurance` is ticked. */
  insuranceDate: string
  puc: boolean
  isAccidental: boolean
}

export const EMPTY_CAR_SELLING_FORM: CarSellingFormValues = {
  ownerName: '',
  mobileNumber: '',
  address: '',
  yearOfVehicle: '',
  carType: '',
  companyName: '',
  carNumber: '',
  carOwner: '',
  carColor: '',
  fuelType: '',
  sellingPrice: '',
  description: '',
  insurance: false,
  insuranceDate: '',
  puc: false,
  isAccidental: false,
}

const text = (value: string | number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

/** Fills the dialog from a saved car, with `null` read back as blank. */
export function carSellingFormValues(car: CarSellingRecord): CarSellingFormValues {
  return {
    ownerName: text(car.ownerName),
    mobileNumber: text(car.mobileNumber),
    address: text(car.address),
    yearOfVehicle: text(car.yearOfVehicle),
    carType: text(car.carType),
    companyName: text(car.companyName),
    carNumber: text(car.carNumber),
    carOwner: text(car.carOwner),
    carColor: text(car.carColor),
    fuelType: text(car.fuelType),
    sellingPrice: text(car.sellingPrice),
    description: text(car.description),
    insurance: Boolean(car.insurance),
    insuranceDate: toDateInput(car.insuranceDate),
    puc: Boolean(car.puc),
    isAccidental: Boolean(car.isAccidental),
  }
}

/** Blank optional fields are left out entirely rather than sent empty. */
export function toCreateCarSellingPayload(values: CarSellingFormValues): CreateCarSellingPayload {
  const address = values.address.trim()
  const year = values.yearOfVehicle.trim()
  const carType = values.carType.trim()
  const companyName = values.companyName.trim()
  const carNumber = normalizeVehicleNumber(values.carNumber)
  const owners = values.carOwner.trim()
  const carColor = values.carColor.trim()
  const description = values.description.trim()
  const insuranceDate = values.insurance ? values.insuranceDate.trim() : ''

  return {
    ownerName: values.ownerName.trim(),
    mobileNumber: values.mobileNumber.trim(),
    // Required on the form, so always there by the time it is sent.
    sellingPrice: Number(values.sellingPrice.trim()),
    ...(address ? { address } : {}),
    ...(year ? { yearOfVehicle: Number(year) } : {}),
    ...(carType ? { carType } : {}),
    ...(companyName ? { companyName } : {}),
    // Required on the form, so always there by the time it is sent.
    carNumber,
    ...(owners ? { carOwner: Number(owners) } : {}),
    ...(carColor ? { carColor } : {}),
    // Required on the form, so always there by the time it is sent.
    fuelType: values.fuelType.trim(),
    insurance: values.insurance,
    ...(insuranceDate ? { insuranceDate } : {}),
    puc: values.puc,
    isAccidental: values.isAccidental,
    ...(description ? { description } : {}),
  }
}

/**
 * `PUT` takes only what changed, so the form is compared with the car it was
 * filled from. A field cleared by the user goes out as the API's own "blank":
 * `''` for text and the year, `null` for the owner count and insurance date.
 * An empty result means nothing changed and nothing needs to be sent.
 */
export function toUpdateCarSellingPayload(
  values: CarSellingFormValues,
  original: CarSellingRecord,
): UpdateCarSellingPayload {
  const before = carSellingFormValues(original)
  const payload: UpdateCarSellingPayload = {}
  const changed = (key: keyof CarSellingFormValues) => {
    const now = values[key]
    const was = before[key]
    return typeof now === 'string' ? now.trim() !== String(was).trim() : now !== was
  }

  if (changed('ownerName')) payload.ownerName = values.ownerName.trim()
  if (changed('mobileNumber')) payload.mobileNumber = values.mobileNumber.trim()
  if (changed('address')) payload.address = values.address.trim()
  if (changed('carType')) payload.carType = values.carType.trim()
  if (changed('companyName')) payload.companyName = values.companyName.trim()
  if (changed('carNumber')) payload.carNumber = normalizeVehicleNumber(values.carNumber)
  if (changed('carColor')) payload.carColor = values.carColor.trim()
  if (changed('fuelType')) payload.fuelType = values.fuelType.trim()
  if (changed('description')) payload.description = values.description.trim()
  if (changed('yearOfVehicle')) {
    const year = values.yearOfVehicle.trim()
    payload.yearOfVehicle = year ? Number(year) : ''
  }
  if (changed('carOwner')) {
    const owners = values.carOwner.trim()
    payload.carOwner = owners ? Number(owners) : null
  }
  if (changed('sellingPrice')) {
    const price = values.sellingPrice.trim()
    // "425000" and "425000.00" are the same price. Blank never gets here:
    // the form requires a price, and the API refuses to clear one.
    if (price && Number(price) !== Number(original.sellingPrice)) payload.sellingPrice = Number(price)
  }
  if (changed('insurance')) payload.insurance = values.insurance
  if (changed('insuranceDate')) {
    const date = values.insuranceDate.trim()
    payload.insuranceDate = date || null
  }
  if (changed('puc')) payload.puc = values.puc
  if (changed('isAccidental')) payload.isAccidental = values.isAccidental

  return payload
}

const CAR_SELLING_FORM_FIELDS: string[] = Object.keys(EMPTY_CAR_SELLING_FORM)

/** Puts a 400's per-field messages back on the fields that caused them. */
export function applyCarSellingApiError(
  error: ApiError,
  setError: UseFormSetError<CarSellingFormValues>,
  setFocus: UseFormSetFocus<CarSellingFormValues>,
): void {
  const rejected = error.fieldErrors.filter((e) => CAR_SELLING_FORM_FIELDS.includes(e.field))

  for (const { field, message } of rejected) {
    setError(field as keyof CarSellingFormValues, { type: 'server', message })
  }

  if (rejected[0]) setFocus(rejected[0].field as keyof CarSellingFormValues)
}
