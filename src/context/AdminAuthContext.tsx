import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  ADMIN_AUTH_STORAGE_KEY,
  clearAdminSession,
  loadAdminSession,
  saveAdminSession,
} from '@/lib/adminAuthStorage'
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle'
import type { LogoutReason } from '@/hooks/useSessionLifecycle'
import { adminService } from '@/services/adminService'
import type { AdminLoginPayload, AdminSession, AdminUser } from '@/types/admin'

/** How the platform admin's session is persisted, read and dropped. */
const ADMIN_SESSION_STORE = {
  storageKey: ADMIN_AUTH_STORAGE_KEY,
  load: loadAdminSession,
  save: saveAdminSession,
  clear: clearAdminSession,
}

interface AdminAuthContextValue {
  session: AdminSession | null
  admin: AdminUser | null
  isAuthenticated: boolean
  /** True until the stored session has been read on first render. */
  initializing: boolean
  login: (payload: AdminLoginPayload) => Promise<AdminSession>
  logout: (reason?: LogoutReason) => void
  /** Set when the session ended because the token expired. */
  logoutReason: LogoutReason | null
  clearLogoutReason: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

/**
 * The platform admin's session, held entirely apart from the garage owner's:
 * a different endpoint, a different token, a different storage key. Both can be
 * signed in at once in one browser, and signing out of one leaves the other be.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { session, initializing, startSession, logout, logoutReason, clearLogoutReason } =
    useSessionLifecycle<AdminSession>(ADMIN_SESSION_STORE, 'admin')

  const signIn = useCallback(
    async (payload: AdminLoginPayload) => {
      const data = await adminService.login(payload)

      const next: AdminSession = {
        token: data.token,
        expiresIn: data.expiresIn,
        expiresAt: data.expiresAt,
        admin: data.admin,
      }

      startSession(next)
      return next
    },
    [startSession],
  )

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      admin: session?.admin ?? null,
      isAuthenticated: Boolean(session),
      initializing,
      login: signIn,
      logout,
      logoutReason,
      clearLogoutReason,
    }),
    [session, initializing, signIn, logout, logoutReason, clearLogoutReason],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  return ctx
}
