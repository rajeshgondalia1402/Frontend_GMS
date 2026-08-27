import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { AUTH_STORAGE_KEY, clearSession, loadSession, saveSession } from '@/lib/authStorage'
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle'
import type { LogoutReason } from '@/hooks/useSessionLifecycle'
import { authService } from '@/services/authService'
import type { AuthSession, AuthSubscription, AuthUser, LoginPayload, ProfileUser } from '@/types/auth'

export type { LogoutReason }

/** How the garage owner's session is persisted, read and dropped. */
const OWNER_SESSION_STORE = {
  storageKey: AUTH_STORAGE_KEY,
  load: loadSession,
  save: saveSession,
  clear: clearSession,
}

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
  const {
    session,
    initializing,
    startSession,
    updateSession,
    logout,
    logoutReason,
    clearLogoutReason,
  } = useSessionLifecycle<AuthSession>(OWNER_SESSION_STORE, 'user')

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

      startSession(next)
      return next
    },
    [startSession],
  )

  /** Merges the fuller profile from GET /auth/me into the stored session. */
  const syncProfile = useCallback(
    (user: ProfileUser, subscription: AuthSubscription | null) => {
      updateSession((current) => ({ ...current, user, subscription }))
    },
    [updateSession],
  )

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
      clearLogoutReason,
    }),
    [session, initializing, signIn, logout, syncProfile, logoutReason, clearLogoutReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
