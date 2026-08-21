/**
 * Carries the mobile number from the "forgot password" screen to the reset
 * screen, together with the moment the OTP was sent so the resend cooldown and
 * validity countdown survive a refresh.
 *
 * No password is ever stored here — only the number and a timestamp.
 */
const PENDING_KEY = 'gms.auth.pendingPasswordReset'

/** Slightly longer than the API's 10-minute OTP validity. */
const PENDING_TTL_MS = 15 * 60 * 1000

export interface PendingPasswordReset {
  mobileNumber: string
  /** Epoch ms of the last successful `forgot-password` call. */
  sentAt: number
}

function isValid(value: unknown): value is PendingPasswordReset {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<PendingPasswordReset>
  return typeof entry.mobileNumber === 'string' && typeof entry.sentAt === 'number'
}

export function savePendingReset(mobileNumber: string, sentAt: number = Date.now()): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ mobileNumber, sentAt }))
  } catch {
    /* storage blocked — the caller falls back to the form */
  }
}

/** Returns the parked entry, or `null` if there is none or it has gone stale. */
export function loadPendingReset(now: number = Date.now()): PendingPasswordReset | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed) || now - parsed.sentAt > PENDING_TTL_MS) {
      clearPendingReset()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearPendingReset(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}
