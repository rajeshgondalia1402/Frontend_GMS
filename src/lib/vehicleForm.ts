import type { UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import type { ApiError } from '@/services/httpClient'
import { normalizeVehicleNumber } from '@/lib/validation'
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleStatus,
  VehicleSummary,
} from '@/types/vehicle'

/**
 * Shared shape of the vehicle form, so adding a vehicle and editing one
 * collect and map exactly the same fields.
 */
export interface VehicleFormValues {
  vehicleNumber: string
  vehicleType: string
  description: string
  /** Kept as text so the field can be empty and digits-only while typing. */
  currentKm: string
  brand: string
  model: string
  variant: string
  fuelType: string
  color: string
  insuranceExpiry: string
  status: VehicleStatus
}

export const EMPTY_VEHICLE_FORM: VehicleFormValues = {
  vehicleNumber: '',
  vehicleType: '',
  description: '',
  currentKm: '',
  brand: '',
  model: '',
  variant: '',
  fuelType: '',
  color: '',
  insuranceExpiry: '',
  // The API defaults to PENDING when no status is sent.
  status: 'PENDING',
}

export const VEHICLE_TYPE_OPTIONS = [
  'Car',
  'Bike',
  'Scooter',
  'Auto Rickshaw',
  'Truck',
  'Bus',
  'Tractor',
  'Other',
].map((t) => ({ label: t, value: t }))

export const FUEL_TYPE_OPTIONS = ['Petrol', 'Diesel', 'CNG', 'LPG', 'Electric', 'Hybrid'].map(
  (f) => ({ label: f, value: f }),
)

/** Fields the API can report a validation error against. */
const VEHICLE_FORM_FIELDS: string[] = [
  'vehicleNumber',
  'vehicleType',
  'description',
  'currentKm',
  'brand',
  'model',
  'variant',
  'fuelType',
  'color',
  'insuranceExpiry',
  'status',
]

/** Everything the API stores about a vehicle, bar the ids. */
type VehicleFields = Omit<Required<CreateVehiclePayload>, 'customerId'>

/**
 * Copies what stays the same about a vehicle from one visit to the next.
 * The reading, the description and the status are deliberately left at their
 * defaults: those are what the visit being recorded is for, and the API keeps
 * a row per visit. A vehicle booked in again starts Pending, whatever the
 * visit it was copied from ended as.
 */
export function nextVisitFormValues(seed?: VehicleSummary): VehicleFormValues {
  if (!seed) return EMPTY_VEHICLE_FORM

  return {
    ...EMPTY_VEHICLE_FORM,
    vehicleNumber: seed.vehicleNumber ?? '',
    vehicleType: seed.vehicleType ?? '',
    brand: seed.brand ?? '',
    model: seed.model ?? '',
    variant: seed.variant ?? '',
    fuelType: seed.fuelType ?? '',
    color: seed.color ?? '',
    // The date input only takes `YYYY-MM-DD`, however the API sends it.
    insuranceExpiry: seed.insuranceExpiry ? seed.insuranceExpiry.slice(0, 10) : '',
  }
}

/**
 * The row as it stands, for editing it — unlike a next visit, the reading, the
 * description and the status are the stored ones. The API returns `null` for
 * anything that was left blank.
 */
export function vehicleToFormValues(vehicle: VehicleSummary): VehicleFormValues {
  return {
    ...nextVisitFormValues(vehicle),
    currentKm: typeof vehicle.currentKm === 'number' ? String(vehicle.currentKm) : '',
    description: vehicle.description ?? '',
    status: vehicle.status ?? EMPTY_VEHICLE_FORM.status,
  }
}

/** Every stored field, blanks included — what the two payloads are built from. */
function toVehicleFields(values: VehicleFormValues): VehicleFields {
  return {
    vehicleNumber: normalizeVehicleNumber(values.vehicleNumber),
    vehicleType: values.vehicleType.trim(),
    description: values.description.trim(),
    currentKm: Number(values.currentKm.trim()),
    brand: values.brand.trim(),
    model: values.model.trim(),
    variant: values.variant.trim(),
    fuelType: values.fuelType.trim(),
    color: values.color.trim(),
    insuranceExpiry: values.insuranceExpiry.trim(),
    status: values.status,
  }
}

/** Optional fields are left out entirely rather than sent empty. */
export function toCreateVehiclePayload(
  values: VehicleFormValues,
  customerId: string,
): CreateVehiclePayload {
  const fields = toVehicleFields(values)
  const payload: CreateVehiclePayload = {
    customerId,
    vehicleNumber: fields.vehicleNumber,
    vehicleType: fields.vehicleType,
    description: fields.description,
    currentKm: fields.currentKm,
    status: fields.status,
  }

  const optional = ['brand', 'model', 'variant', 'fuelType', 'color', 'insuranceExpiry'] as const
  for (const key of optional) {
    if (fields[key]) payload[key] = fields[key]
  }

  return payload
}

/**
 * `PUT` takes only what changed — and rejects an empty body with a 400 — so
 * the edited form is diffed against the row it was seeded from. A field the
 * owner cleared goes out as `""`, which is how the API stores a `null`.
 */
export function toUpdateVehiclePayload(
  values: VehicleFormValues,
  vehicle: VehicleSummary,
): UpdateVehiclePayload {
  const next = toVehicleFields(values)
  const current = toVehicleFields(vehicleToFormValues(vehicle))

  const patch: UpdateVehiclePayload = {}
  for (const key of Object.keys(next) as (keyof VehicleFields)[]) {
    if (next[key] !== current[key]) {
      // Each key is written with its own value, so the union stays sound.
      Object.assign(patch, { [key]: next[key] })
    }
  }
  return patch
}

/**
 * The updated row comes back from the API; the patch is only a fallback for a
 * response that carries no body. A cleared optional field reads back as `null`.
 */
export function applyVehicleUpdate<T extends VehicleSummary>(
  vehicle: T,
  patch: UpdateVehiclePayload,
  updated?: VehicleSummary | null,
): T {
  if (updated && typeof updated.id === 'string') return { ...vehicle, ...updated }

  const changed = Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, value === '' ? null : value]),
  )
  return { ...vehicle, ...changed }
}

/** Puts an API failure back on the field that caused it. */
export function applyVehicleApiError(
  error: ApiError,
  setError: UseFormSetError<VehicleFormValues>,
  setFocus: UseFormSetFocus<VehicleFormValues>,
): void {
  for (const { field, message } of error.fieldErrors) {
    if (VEHICLE_FORM_FIELDS.includes(field)) {
      setError(field as keyof VehicleFormValues, { type: 'server', message })
    }
  }

  const firstRejected = error.fieldErrors.find((e) => VEHICLE_FORM_FIELDS.includes(e.field))
  if (firstRejected) setFocus(firstRejected.field as keyof VehicleFormValues)
}
