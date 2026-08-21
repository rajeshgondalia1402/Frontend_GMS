import type { AuthSession } from '@/types/auth'

/**
 * Persists the login session (token + expiry + profile) in localStorage so a
 * page refresh keeps the user signed in until the token expires.
 */
export const AUTH_STORAGE_KEY = 'gms.auth.session'

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<AuthSession>
  return (
    typeof s.token === 'string' &&
    s.token.length > 0 &&
    typeof s.expiresAt === 'string' &&
    !Number.isNaN(Date.parse(s.expiresAt)) &&
    !!s.user &&
    typeof s.user.ownerName === 'string'
  )
}

/** Milliseconds left before the token expires (0 once it has). */
export function millisecondsUntilExpiry(expiresAt: string): number {
  const expiry = Date.parse(expiresAt)
  if (Number.isNaN(expiry)) return 0
  return Math.max(0, expiry - Date.now())
}

export function isSessionExpired(session: AuthSession): boolean {
  return millisecondsUntilExpiry(session.expiresAt) <= 0
}

/** Reads the stored session, discarding anything malformed or already expired. */
export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isValidSession(parsed)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    if (isSessionExpired(parsed)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* storage full or blocked (private mode) — session stays in memory only */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Bearer token for API calls, or `null` when signed out / expired. */
export function getStoredToken(): string | null {
  return loadSession()?.token ?? null
}
