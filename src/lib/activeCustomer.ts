import type { CustomerRecord } from '@/types/customer'

/**
 * The customer being set up is parked here while the owner adds vehicles for
 * them. The vehicle page is reached by URL and the API has no "fetch one
 * customer" endpoint yet, so without this a refresh would lose the details the
 * page displays. `sessionStorage`, so it never outlives the tab.
 */
const ACTIVE_KEY = 'gms.customers.active'

/** Long enough for one sitting; a stale entry is treated as abandoned. */
const ACTIVE_TTL_MS = 2 * 60 * 60 * 1000

interface StoredActive {
  customer: CustomerRecord
  savedAt: number
}

function isValid(value: unknown): value is StoredActive {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<StoredActive>
  const customer = entry.customer
  return (
    typeof entry.savedAt === 'number' &&
    !!customer &&
    typeof customer.id === 'string' &&
    typeof customer.fullName === 'string' &&
    typeof customer.mobileNumber === 'string'
  )
}

export function saveActiveCustomer(customer: CustomerRecord, now: number = Date.now()): void {
  try {
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify({ customer, savedAt: now }))
  } catch {
    /* storage blocked — the page falls back to the navigation state */
  }
}

/** Returns the parked customer, or `null` when it is missing, stale or another one. */
export function loadActiveCustomer(id: string, now: number = Date.now()): CustomerRecord | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed) || now - parsed.savedAt > ACTIVE_TTL_MS) {
      clearActiveCustomer()
      return null
    }
    return parsed.customer.id === id ? parsed.customer : null
  } catch {
    return null
  }
}

export function clearActiveCustomer(): void {
  try {
    sessionStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* ignore */
  }
}
