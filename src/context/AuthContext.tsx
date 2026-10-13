import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { AUTH_STORAGE_KEY, clearSession, loadSession, saveSession } from '@/lib/authStorage'
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle'
import type { LogoutReason } from '@/hooks/useSessionLifecycle'
import { authService } from '@/services/authService'
import { setSubscriptionRequiredHandler } from '@/services/httpClient'
import type {
  AuthSession,
  AuthSubscription,
  AuthUser,
  LoginData,
  LoginPayload,
  ProfileUser,
  RenewSubscriptionPayload,
} from '@/types/auth'

export type { LogoutReason }

/** How the garage owner's session is persisted, read and dropped. */
const OWNER_SESSION_STORE = {
  storageKey: AUTH_STORAGE_KEY,
  load: loadSession,
  save: saveSession,
  clear: clearSession,
}

/** `setTimeout` truncates delays above 2^31-1 ms (~24.8 days). */
const MAX_TIMEOUT_MS = 2_147_483_647

/** The same words the API uses, for a sign-out the client notices first. */
function subscriptionEndedMessage(subscription: AuthSubscription): string {
  return subscription.plan === 'FREE_TRIAL'
    ? 'Your free trial has ended. Please choose a subscription plan to continue.'
    : 'Your subscription has expired. Please renew your subscription to continue.'
}

function toSession(data: LoginData): AuthSession {
  return {
    token: data.token,
    expiresIn: data.expiresIn,
    expiresAt: data.expiresAt,
    user: data.user,
    subscription: data.subscription ?? null,
  }
}

interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | null
  isAuthenticated: boolean
  /** True until the stored session has been read on first render. */
  initializing: boolean
  login: (payload: LoginPayload) => Promise<AuthSession>
  /** Starts a new plan for a garage whose trial or plan has ended, and signs it in. */
  renew: (payload: RenewSubscriptionPayload) => Promise<AuthSession>
  logout: (reason?: LogoutReason) => void
  /** Folds fresher profile data (e.g. from GET /auth/me) into the session. */
  syncProfile: (user: ProfileUser, subscription: AuthSubscription | null) => void
  /** Set when the session ended on its own — the token or the subscription ran out. */
  logoutReason: LogoutReason | null
  /** The API's words for that sign-out, e.g. "Your free trial has ended...". */
  logoutMessage: string | null
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
    logoutMessage,
    clearLogoutReason,
  } = useSessionLifecycle<AuthSession>(OWNER_SESSION_STORE, 'user')

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const next = toSession(await authService.login(payload))
      startSession(next)
      return next
    },
    [startSession],
  )

  const renew = useCallback(
    async (payload: RenewSubscriptionPayload) => {
      const next = toSession(await authService.renewSubscription(payload))
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

  // The API refused a call because the trial or plan has ended: every garage
  // screen would now fail, so sign out and let the login page offer the plans.
  useEffect(() => {
    setSubscriptionRequiredHandler((message) => logout('subscription', message))
    return () => setSubscriptionRequiredHandler(null)
  }, [logout])

  // Sign out the moment the subscription's end date is reached, even on a
  // screen that is not making requests — and re-check when a sleeping tab wakes.
  const subscription = session?.subscription ?? null
  const endDate = subscription?.endDate
  useEffect(() => {
    if (!subscription || !endDate) return
    const endsAt = new Date(endDate).getTime()
    if (Number.isNaN(endsAt)) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const check = () => {
      const remaining = endsAt - Date.now()
      if (remaining <= 0) {
        logout('subscription', subscriptionEndedMessage(subscription))
        return
      }
      timer = setTimeout(check, Math.min(remaining, MAX_TIMEOUT_MS))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timer !== null) clearTimeout(timer)
        check()
      }
    }

    check()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (timer !== null) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // `subscription` changes identity on every profile sync; the end date is
    // what decides when the timer fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate, logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      initializing,
      login: signIn,
      renew,
      logout,
      syncProfile,
      logoutReason,
      logoutMessage,
      clearLogoutReason,
    }),
    [
      session,
      initializing,
      signIn,
      renew,
      logout,
      syncProfile,
      logoutReason,
      logoutMessage,
      clearLogoutReason,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
