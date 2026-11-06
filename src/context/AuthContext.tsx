import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { AUTH_STORAGE_KEY, clearSession, loadSession, saveSession } from '@/lib/authStorage'
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle'
import type { LogoutReason } from '@/hooks/useSessionLifecycle'
import { authService } from '@/services/authService'
import { subscriptionService } from '@/services/subscriptionService'
import { setSubscriptionRequiredHandler } from '@/services/httpClient'
import type {
  AuthAccess,
  AuthSession,
  AuthSubscription,
  AuthUser,
  LoginData,
  LoginPayload,
  ProfileUser,
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

/** The same words the API uses, for an end the client notices first. */
function subscriptionEndedMessage(subscription: AuthSubscription | null): string {
  if (!subscription) return 'No active subscription found. Please choose a subscription plan to continue.'
  return subscription.plan === 'FREE_TRIAL'
    ? 'Your free trial has ended. Please choose a subscription plan to continue.'
    : 'Your subscription has expired. Please renew your subscription to continue.'
}

/**
 * The access state of a session. Sessions stored before the billing flow
 * existed carry no `access`, so it is worked out from the subscription dates
 * until the next refresh from the API replaces it.
 */
export function accessOf(session: AuthSession | null): AuthAccess | null {
  if (!session) return null
  if (session.access) return session.access

  const subscription = session.subscription
  const live =
    !!subscription && subscription.status === 'ACTIVE' && Date.parse(subscription.endDate) > Date.now()

  return {
    hasAccess: live,
    status: live ? 'ACTIVE' : subscription ? 'EXPIRED' : 'NO_SUBSCRIPTION',
    message: live ? null : subscriptionEndedMessage(subscription),
    subscription,
    upcoming: [],
  }
}

function toSession(data: LoginData): AuthSession {
  return {
    token: data.token,
    expiresIn: data.expiresIn,
    expiresAt: data.expiresAt,
    user: data.user,
    subscription: data.subscription ?? null,
    access: data.access ?? null,
  }
}

interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | null
  isAuthenticated: boolean
  /** True until the stored session has been read on first render. */
  initializing: boolean
  /** Whether the garage has a live subscription (the paid screens). */
  access: AuthAccess | null
  hasAccess: boolean
  login: (payload: LoginPayload) => Promise<AuthSession>
  logout: (reason?: LogoutReason) => void
  /** Re-reads the access state from GET /api/subscription/current. */
  refreshAccess: () => Promise<AuthAccess | null>
  /** Stores an access state the API just returned (e.g. after a payment). */
  applyAccess: (access: AuthAccess) => void
  /** Folds fresher profile data (e.g. from GET /auth/me) into the session. */
  syncProfile: (user: ProfileUser, subscription: AuthSubscription | null, access?: AuthAccess) => void
  /** Set when the session ended on its own — the token ran out. */
  logoutReason: LogoutReason | null
  /** The API's words for that sign-out. */
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

  const applyAccess = useCallback(
    (access: AuthAccess) => {
      updateSession((current) => ({ ...current, subscription: access.subscription, access }))
    },
    [updateSession],
  )

  const refreshAccess = useCallback(async () => {
    try {
      const current = await subscriptionService.getCurrent()
      const access: AuthAccess = {
        hasAccess: current.hasAccess,
        status: current.status,
        message: current.message,
        isFreeTrial: current.isFreeTrial,
        subscription: current.subscription,
        upcoming: current.upcoming ?? [],
        freeTrialUsed: current.freeTrialUsed,
      }
      applyAccess(access)
      return access
    } catch {
      // 401 already signed out; anything else keeps the access we had.
      return null
    }
  }, [applyAccess])

  /** Merges the fuller profile from GET /auth/me into the stored session. */
  const syncProfile = useCallback(
    (user: ProfileUser, subscription: AuthSubscription | null, access?: AuthAccess) => {
      updateSession((current) => ({ ...current, user, subscription, access: access ?? current.access }))
    },
    [updateSession],
  )

  // The API refused a paid screen because the trial or plan has ended. The
  // account is still signed in: drop the access, and the route guard sends the
  // garage to the plans.
  useEffect(() => {
    setSubscriptionRequiredHandler((message) => {
      updateSession((current) => {
        const access = accessOf(current)
        return {
          ...current,
          access: {
            hasAccess: false,
            status: access?.status === 'ACTIVE' ? 'EXPIRED' : (access?.status ?? 'EXPIRED'),
            message,
            subscription: current.subscription,
            upcoming: access?.upcoming ?? [],
          },
        }
      })
    })
    return () => setSubscriptionRequiredHandler(null)
  }, [updateSession])

  // Once per signed-in boot: read the real access state (an old stored session
  // has none, and a renewal bought early may have taken over meanwhile).
  const userId = session?.user.id
  const refreshedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!userId || refreshedFor.current === userId) return
    refreshedFor.current = userId
    void refreshAccess()
  }, [userId, refreshAccess])

  // When the live period's end date is reached - even on a screen that makes no
  // requests - ask the API again: a SCHEDULED renewal may take over, otherwise
  // the access goes and the guard opens the renewal page.
  const access = useMemo(() => accessOf(session), [session])
  const endDate = access?.hasAccess ? access.subscription?.endDate : undefined
  useEffect(() => {
    if (!endDate) return
    const endsAt = new Date(endDate).getTime()
    if (Number.isNaN(endsAt)) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const check = () => {
      const remaining = endsAt - Date.now()
      if (remaining <= 0) {
        void refreshAccess().then((fresh) => {
          if (fresh === null) {
            updateSession((current) => ({
              ...current,
              access: {
                hasAccess: false,
                status: 'EXPIRED',
                message: subscriptionEndedMessage(current.subscription),
                subscription: current.subscription,
                upcoming: [],
              },
            }))
          }
        })
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
  }, [endDate, refreshAccess, updateSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      initializing,
      access,
      hasAccess: Boolean(access?.hasAccess),
      login: signIn,
      logout,
      refreshAccess,
      applyAccess,
      syncProfile,
      logoutReason,
      logoutMessage,
      clearLogoutReason,
    }),
    [
      session,
      initializing,
      access,
      signIn,
      logout,
      refreshAccess,
      applyAccess,
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
