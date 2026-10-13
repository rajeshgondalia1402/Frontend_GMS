import { isSessionExpired } from './authStorage'
import type { AdminSession } from '@/types/admin'

/**
 * The admin session lives under its own key, separate from the garage owner's.
 * The two are different accounts on different tokens, so signing out of one
 * must never touch the other — and both may be open in the same browser.
 */
export const ADMIN_AUTH_STORAGE_KEY = 'gms.admin.session'

function isValidAdminSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<AdminSession>
  return (
    typeof s.token === 'string' &&
    s.token.length > 0 &&
    typeof s.expiresAt === 'string' &&
    !Number.isNaN(Date.parse(s.expiresAt)) &&
    !!s.admin &&
    typeof s.admin.mobileNumber === 'string'
  )
}

/** Reads the stored session, discarding anything malformed or already expired. */
export function loadAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isValidAdminSession(parsed)) {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
      return null
    }
    if (isSessionExpired(parsed)) {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveAdminSession(session: AdminSession): void {
  try {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* storage full or blocked (private mode) — session stays in memory only */
  }
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Bearer token for admin API calls, or `null` when signed out / expired. */
export function getStoredAdminToken(): string | null {
  return loadAdminSession()?.token ?? null
}
