import type { UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import type { ApiError } from '@/services/httpClient'
import type {
  CreateCustomerPayload,
  CustomerRecord,
  UpdateCustomerPayload,
} from '@/types/customer'

/**
 * Shared shape of the customer form, so the "Add Customer" page and the edit
 * dialog collect and map exactly the same fields.
 */
export interface CustomerFormValues {
  fullName: string
  mobileNumber: string
  /** UI only — mirrors the mobile number into the WhatsApp field. */
  sameAsMobile: boolean
  whatsappNumber: string
  email: string
  city: string
  address: string
  notes: string
}

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  fullName: '',
  mobileNumber: '',
  sameAsMobile: false,
  whatsappNumber: '',
  email: '',
  city: '',
  address: '',
  notes: '',
}

/** Fields the API can report a validation error against. */
const CUSTOMER_FORM_FIELDS: string[] = [
  'fullName',
  'mobileNumber',
  'whatsappNumber',
  'email',
  'city',
  'address',
  'notes',
]

/** The API returns `null` for anything the owner left blank. */
export function customerToFormValues(customer: CustomerRecord): CustomerFormValues {
  const mobileNumber = customer.mobileNumber ?? ''
  const whatsappNumber = customer.whatsappNumber ?? ''

  return {
    fullName: customer.fullName ?? '',
    mobileNumber,
    whatsappNumber,
    sameAsMobile: Boolean(mobileNumber) && mobileNumber === whatsappNumber,
    email: customer.email ?? '',
    city: customer.city ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
  }
}

/** Optional fields go out as `""` — the API stores those as `null`. */
export function toCreateCustomerPayload(values: CustomerFormValues): CreateCustomerPayload {
  return {
    fullName: values.fullName.trim(),
    mobileNumber: values.mobileNumber.trim(),
    whatsappNumber: values.whatsappNumber.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    notes: values.notes.trim(),
  }
}

/**
 * `PUT` takes only what changed — and rejects an empty body with a 400 — so
 * the edited form is diffed against the row it was seeded from.
 */
export function toUpdateCustomerPayload(
  values: CustomerFormValues,
  customer: CustomerRecord,
): UpdateCustomerPayload {
  const next = toCreateCustomerPayload(values)
  const current = toCreateCustomerPayload(customerToFormValues(customer))

  const patch: UpdateCustomerPayload = {}
  for (const key of Object.keys(next) as (keyof CreateCustomerPayload)[]) {
    if (next[key] !== current[key]) patch[key] = next[key]
  }
  return patch
}

/**
 * The updated row comes back from the API; the patch is only a fallback for a
 * response that carries no body. A cleared optional field reads back as `null`.
 */
export function applyCustomerUpdate(
  customer: CustomerRecord,
  patch: UpdateCustomerPayload,
  updated?: CustomerRecord | null,
): CustomerRecord {
  if (updated && typeof updated.id === 'string') return updated

  const changed = Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, value === '' ? null : value]),
  )
  return { ...customer, ...changed } as CustomerRecord
}

/**
 * Puts an API failure back on the field that caused it: a 400 carries a
 * message per rejected field, and a 409 is always the mobile number already
 * belonging to another customer of this garage.
 */
export function applyCustomerApiError(
  error: ApiError,
  setError: UseFormSetError<CustomerFormValues>,
  setFocus: UseFormSetFocus<CustomerFormValues>,
): void {
  for (const { field, message } of error.fieldErrors) {
    if (CUSTOMER_FORM_FIELDS.includes(field)) {
      setError(field as keyof CustomerFormValues, { type: 'server', message })
    }
  }

  const firstRejected = error.fieldErrors.find((e) => CUSTOMER_FORM_FIELDS.includes(e.field))
  if (firstRejected) {
    setFocus(firstRejected.field as keyof CustomerFormValues)
    return
  }

  if (error.status === 409) {
    setError('mobileNumber', { type: 'server', message: error.message })
    setFocus('mobileNumber')
  }
}
