import type { Tone } from '@/components/ui/Badge'
import type { StaffCategory, StaffStatus } from '@/types/staff'

/** In the order they appear in the category dropdown and the filter pills. */
export const STAFF_CATEGORIES: StaffCategory[] = [
  'MECHANIC',
  'SERVICE_ADVISOR',
  'HELPER',
  'OTHER',
]

const CATEGORY_LABELS: Record<StaffCategory, string> = {
  MECHANIC: 'Mechanic',
  SERVICE_ADVISOR: 'Service Advisor',
  HELPER: 'Helper',
  OTHER: 'Other',
}

/** Plural, for the filter pills above the list. */
const CATEGORY_PLURALS: Record<StaffCategory, string> = {
  MECHANIC: 'Mechanics',
  SERVICE_ADVISOR: 'Service Advisors',
  HELPER: 'Helpers',
  OTHER: 'Other',
}

/** Falls back to the raw value, so a category added by the API still reads. */
export function staffCategoryLabel(category: StaffCategory): string {
  return CATEGORY_LABELS[category] ?? category
}

export const STAFF_CATEGORY_OPTIONS = STAFF_CATEGORIES.map((category) => ({
  label: staffCategoryLabel(category),
  value: category,
}))

/** "All" plus one pill per category; the value is what `?category=` takes. */
export const STAFF_CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  ...STAFF_CATEGORIES.map((category) => ({
    label: CATEGORY_PLURALS[category] ?? staffCategoryLabel(category),
    value: category as string,
  })),
]

const STATUS_LABELS: Record<StaffStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

const STATUS_TONES: Record<StaffStatus, Tone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

export function staffStatusLabel(status: StaffStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function staffStatusTone(status: StaffStatus): Tone {
  return STATUS_TONES[status] ?? 'neutral'
}

/**
 * "All" leaves `?status=` off entirely, which is how the API returns the
 * active and the inactive staff together — the garage's whole book in one call.
 */
export const STAFF_STATUS_OPTIONS = [
  { label: 'Active & Inactive', value: 'all' },
  ...(['ACTIVE', 'INACTIVE'] as StaffStatus[]).map((status) => ({
    label: `${staffStatusLabel(status)} only`,
    value: status as string,
  })),
]

/**
 * The monthly pay, or a dash while it has not been agreed yet. Whole rupees
 * stay clean; paise are shown to two places, as the API stores them.
 */
export function staffSalaryLabel(salary: number | string | null | undefined): string {
  if (salary === null || salary === undefined || salary === '') return '—'

  const amount = Number(salary)
  if (!Number.isFinite(amount)) return '—'

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
