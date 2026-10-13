import type { UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import type { ApiError } from '@/services/httpClient'
import type {
  CreateStaffPayload,
  StaffCategory,
  StaffRecord,
  StaffStatus,
  UpdateStaffPayload,
} from '@/types/staff'

/** The staff dialog's fields, all held as strings while they are typed. */
export interface StaffFormValues {
  name: string
  category: string
  role: string
  mobileNumber: string
  /** Blank while the pay has not been agreed yet. */
  monthlySalary: string
  /** Only shown while editing — the API sets `ACTIVE` on everyone new. */
  status: string
}

export const EMPTY_STAFF_FORM: StaffFormValues = {
  name: '',
  category: '',
  role: '',
  mobileNumber: '',
  monthlySalary: '',
  status: 'ACTIVE',
}

/** Fills the dialog from a saved row, with `null` read back as blank. */
export function staffFormValues(staff: StaffRecord): StaffFormValues {
  return {
    name: staff.name ?? '',
    category: staff.category ?? '',
    role: staff.role ?? '',
    mobileNumber: staff.mobileNumber ?? '',
    monthlySalary: staff.monthlySalary === null || staff.monthlySalary === undefined
      ? ''
      : String(staff.monthlySalary),
    status: staff.status ?? 'ACTIVE',
  }
}

/** Fields the API can report a validation error against. */
const STAFF_FORM_FIELDS: string[] = [
  'name',
  'category',
  'role',
  'mobileNumber',
  'monthlySalary',
  'status',
]

/**
 * `role` goes out even when blank — the API stores `''` as `null` — but the
 * salary is left out entirely rather than sent empty, which is what "not
 * agreed yet" means to the API.
 */
export function toCreateStaffPayload(values: StaffFormValues): CreateStaffPayload {
  const salary = values.monthlySalary.trim()

  return {
    name: values.name.trim(),
    category: values.category.trim() as StaffCategory,
    mobileNumber: values.mobileNumber.trim(),
    role: values.role.trim(),
    ...(salary ? { monthlySalary: Number(salary) } : {}),
  }
}

/**
 * `PUT /api/auth/staff/:id`. Every updatable field goes out — the dialog was
 * filled from the row, so anything untouched is sent back as it stands and
 * the API rejects an empty body anyway. The salary is left out while it is
 * blank, which is the same "not agreed yet" the create payload means.
 */
export function toUpdateStaffPayload(values: StaffFormValues): UpdateStaffPayload {
  const salary = values.monthlySalary.trim()

  return {
    name: values.name.trim(),
    category: values.category.trim() as StaffCategory,
    mobileNumber: values.mobileNumber.trim(),
    role: values.role.trim(),
    status: values.status.trim() as StaffStatus,
    ...(salary ? { monthlySalary: Number(salary) } : {}),
  }
}

/**
 * Puts an API failure back on the field that caused it: a 400 carries a
 * message per rejected field, and a 409 is always the mobile number already
 * belonging to another active staff member of this garage.
 */
export function applyStaffApiError(
  error: ApiError,
  setError: UseFormSetError<StaffFormValues>,
  setFocus: UseFormSetFocus<StaffFormValues>,
): void {
  for (const { field, message } of error.fieldErrors) {
    if (STAFF_FORM_FIELDS.includes(field)) {
      setError(field as keyof StaffFormValues, { type: 'server', message })
    }
  }

  const firstRejected = error.fieldErrors.find((e) => STAFF_FORM_FIELDS.includes(e.field))
  if (firstRejected) {
    setFocus(firstRejected.field as keyof StaffFormValues)
    return
  }

  if (error.status === 409) {
    setError('mobileNumber', { type: 'server', message: error.message })
    setFocus('mobileNumber')
  }
}
