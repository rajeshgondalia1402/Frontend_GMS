import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AUTH_STORAGE_KEY,
  clearSession,
  loadSession,
  millisecondsUntilExpiry,
  saveSession,
} from '@/lib/authStorage'
import { authService } from '@/services/authService'
import { setUnauthorizedHandler } from '@/services/httpClient'
import type { AuthSession, AuthSubscription, AuthUser, LoginPayload, ProfileUser } from '@/types/auth'

/** `setTimeout` truncates delays above 2^31-1 ms (~24.8 days), and the token
 *  lives for 30 days — so long waits are split into safe chunks. */
const MAX_TIMEOUT_MS = 2_147_483_647

export type LogoutReason = 'manual' | 'expired'

interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | null
  isAuthenticated: boolean
  /** True until the stored session has been read on first render. */
  initializing: boolean
  login: (payload: LoginPayload) => Promise<AuthSession>
  logout: (reason?: LogoutReason) => void
  /** Folds fresher profile data (e.g. from GET /auth/me) into the session. */
  syncProfile: (user: ProfileUser, subscription: AuthSubscription | null) => void
  /** Set when the session ended because the token expired. */
  logoutReason: LogoutReason | null
  clearLogoutReason: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null)
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelExpiryTimer = useCallback(() => {
    if (expiryTimer.current !== null) {
      clearTimeout(expiryTimer.current)
      expiryTimer.current = null
    }
  }, [])

  const logout = useCallback(
    (reason: LogoutReason = 'manual') => {
      cancelExpiryTimer()
      clearSession()
      setSession(null)
      setLogoutReason(reason)
    },
    [cancelExpiryTimer],
  )

  /** Signs the user out the moment `expiresAt` is reached (30 days by default). */
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

  // Restore a previous session on boot (expired ones are dropped by loadSession).
  useEffect(() => {
    const stored = loadSession()
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
    setUnauthorizedHandler(() => logout('expired'))
    return () => setUnauthorizedHandler(null)
  }, [logout])

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
      if (event.key !== null && event.key !== AUTH_STORAGE_KEY) return

      const stored = loadSession()
      setSession(stored)
      if (stored) scheduleAutoLogout(stored.expiresAt)
      else cancelExpiryTimer()
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [scheduleAutoLogout, cancelExpiryTimer])

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const data = await authService.login(payload)

      const next: AuthSession = {
        token: data.token,
        expiresIn: data.expiresIn,
        expiresAt: data.expiresAt,
        user: data.user,
        subscription: data.subscription ?? null,
      }

      saveSession(next)
      setSession(next)
      setLogoutReason(null)
      scheduleAutoLogout(next.expiresAt)
      return next
    },
    [scheduleAutoLogout],
  )

  /** Merges the fuller profile from GET /auth/me into the stored session. */
  const syncProfile = useCallback((user: ProfileUser, subscription: AuthSubscription | null) => {
    setSession((current) => {
      if (!current) return current
      const next: AuthSession = { ...current, user, subscription }
      saveSession(next)
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      initializing,
      login: signIn,
      logout,
      syncProfile,
      logoutReason,
      clearLogoutReason: () => setLogoutReason(null),
    }),
    [session, initializing, signIn, logout, syncProfile, logoutReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
