import type { RegisterPayload } from '@/types/auth'

/**
 * The registration form is filled in before the mobile number is verified, so
 * the payload is parked here while the user is on the OTP screen and replayed
 * to `POST /auth/register` once verification succeeds.
 *
 * `sessionStorage`, not `localStorage`: it holds a plaintext password, so it
 * must not outlive the tab. It is cleared as soon as registration completes,
 * and anything older than the window below is treated as abandoned.
 */
const PENDING_KEY = 'gms.auth.pendingRegistration'

/** Slightly longer than the API's 10-minute OTP validity. */
const PENDING_TTL_MS = 15 * 60 * 1000

interface StoredPending {
  payload: RegisterPayload
  savedAt: number
  /** Set once the mobile number has passed OTP verification. */
  verified?: boolean
}

export interface PendingRegistration {
  payload: RegisterPayload
  verified: boolean
}

function isValid(value: unknown): value is StoredPending {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<StoredPending>
  const p = entry.payload
  return (
    typeof entry.savedAt === 'number' &&
    !!p &&
    typeof p.mobileNumber === 'string' &&
    typeof p.password === 'string' &&
    typeof p.ownerName === 'string' &&
    typeof p.garageName === 'string' &&
    typeof p.city === 'string'
  )
}

export function savePendingRegistration(payload: RegisterPayload, now: number = Date.now()): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ payload, savedAt: now }))
  } catch {
    /* storage blocked — the caller falls back to sending the user back to the form */
  }
}

/** Returns the parked entry, or `null` if there is none or it has gone stale. */
export function loadPendingRegistration(now: number = Date.now()): PendingRegistration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed) || now - parsed.savedAt > PENDING_TTL_MS) {
      clearPendingRegistration()
      return null
    }
    return { payload: parsed.payload, verified: parsed.verified === true }
  } catch {
    return null
  }
}

/**
 * Records that the OTP step is done, so a refresh on the confirmation screen
 * does not send the user back to re-enter a code that was already accepted.
 */
export function markPendingVerified(): void {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return

    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed)) return

    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...parsed, verified: true }))
  } catch {
    /* ignore */
  }
}

export function clearPendingRegistration(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}
