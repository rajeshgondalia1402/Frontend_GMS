import { useCallback, useEffect, useRef, useState } from 'react'
import { millisecondsUntilExpiry } from '@/lib/authStorage'
import { setUnauthorizedHandler } from '@/services/httpClient'
import type { AuthScope } from '@/services/httpClient'

/** `setTimeout` truncates delays above 2^31-1 ms (~24.8 days), and the token
 *  lives for 30 days — so long waits are split into safe chunks. */
const MAX_TIMEOUT_MS = 2_147_483_647

export type LogoutReason = 'manual' | 'expired'

/** The little every stored session has in common. */
interface ExpiringSession {
  token: string
  expiresAt: string
}

interface SessionStore<S> {
  /** localStorage key, so writes from another tab can be recognised. */
  storageKey: string
  load: () => S | null
  save: (session: S) => void
  clear: () => void
}

interface SessionLifecycle<S> {
  session: S | null
  /** True until the stored session has been read on first render. */
  initializing: boolean
  /** Persists a freshly issued session and starts its expiry countdown. */
  startSession: (session: S) => void
  /** Rewrites the stored session in place — no effect while signed out. */
  updateSession: (update: (current: S) => S) => void
  logout: (reason?: LogoutReason) => void
  /** Set when the session ended because the token expired. */
  logoutReason: LogoutReason | null
  clearLogoutReason: () => void
}

/**
 * Everything a stored login needs to stay honest: restore on boot, sign out the
 * moment the token expires, believe a 401 over the local clock, re-check when a
 * sleeping tab wakes, and follow a sign-in or sign-out in another tab.
 *
 * The garage owner and the platform admin are separate accounts on separate
 * tokens, so each gets its own store and its own `scope` — and neither can end
 * the other's session.
 */
export function useSessionLifecycle<S extends ExpiringSession>(
  store: SessionStore<S>,
  scope: AuthScope,
): SessionLifecycle<S> {
  const [session, setSession] = useState<S | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null)
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The store is rebuilt on every render by its caller; only ever read the
  // newest one, so the effects below need not depend on its identity.
  const storeRef = useRef(store)
  storeRef.current = store

  const cancelExpiryTimer = useCallback(() => {
    if (expiryTimer.current !== null) {
      clearTimeout(expiryTimer.current)
      expiryTimer.current = null
    }
  }, [])

  const logout = useCallback(
    (reason: LogoutReason = 'manual') => {
      cancelExpiryTimer()
      storeRef.current.clear()
      setSession(null)
      setLogoutReason(reason)
    },
    [cancelExpiryTimer],
  )

  /** Signs the account out the moment `expiresAt` is reached (30 days by default). */
  const scheduleAutoLogout = useCallback(
    (expiresAt: string) => {
      cancelExpiryTimer()

      const tick = () => {
        const remaining = millisecondsUntilExpiry(expiresAt)
        if (remaining <= 0) {
          logout('expired')
          return
        }
        expiryTimer.current = setTimeout(tick, Math.min(remaining, MAX_TIMEOUT_MS))
      }

      tick()
    },
    [cancelExpiryTimer, logout],
  )

  // Restore a previous session on boot (expired ones are dropped by `load`).
  useEffect(() => {
    const stored = storeRef.current.load()
    if (stored) {
      setSession(stored)
      scheduleAutoLogout(stored.expiresAt)
    }
    setInitializing(false)
    return cancelExpiryTimer
  }, [scheduleAutoLogout, cancelExpiryTimer])

  // A 401 on any authenticated call means the server rejected the token —
  // trust it over the local clock and sign out at once.
  useEffect(() => {
    setUnauthorizedHandler(scope, () => logout('expired'))
    return () => setUnauthorizedHandler(scope, null)
  }, [scope, logout])

  // A tab that was asleep can miss its timer — re-check whenever it wakes up.
  useEffect(() => {
    if (!session) return

    const check = () => {
      if (millisecondsUntilExpiry(session.expiresAt) <= 0) logout('expired')
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', check)
    }
  }, [session, logout])

  // Keep other tabs of the same browser in sync (logout / login elsewhere).
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storeRef.current.storageKey) return

      const stored = storeRef.current.load()
      setSession(stored)
      if (stored) scheduleAutoLogout(stored.expiresAt)
      else cancelExpiryTimer()
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [scheduleAutoLogout, cancelExpiryTimer])

  const startSession = useCallback(
    (next: S) => {
      storeRef.current.save(next)
      setSession(next)
      setLogoutReason(null)
      scheduleAutoLogout(next.expiresAt)
    },
    [scheduleAutoLogout],
  )

  const updateSession = useCallback((update: (current: S) => S) => {
    setSession((current) => {
      if (!current) return current
      const next = update(current)
      storeRef.current.save(next)
      return next
    })
  }, [])

  const clearLogoutReason = useCallback(() => setLogoutReason(null), [])

  return {
    session,
    initializing,
    startSession,
    updateSession,
    logout,
    logoutReason,
    clearLogoutReason,
  }
}
