import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

/** Shown for the one tick it takes to read the stored session. */
function AuthSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-label="Loading" />
    </div>
  )
}

/**
 * Blocks the owner panel until a valid (non-expired) session exists AND the
 * garage has a live subscription. A signed-in garage without one (expired,
 * cancelled, never bought) goes to the plan page instead of being signed out.
 * The API enforces the same rule on every paid endpoint; this only saves the
 * garage a screen full of errors.
 */
export function ProtectedRoute() {
  const { isAuthenticated, initializing, hasAccess } = useAuth()
  const location = useLocation()

  if (initializing) return <AuthSplash />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (!hasAccess) {
    return <Navigate to={`/plans${location.search}`} replace />
  }

  return <Outlet />
}

/**
 * Signed in, subscription or not — the plan / renewal page. A garage that does
 * have access is sent to its billing screen instead, where it can renew early.
 */
export function AccountRoute() {
  const { isAuthenticated, initializing, hasAccess } = useAuth()
  const location = useLocation()

  if (initializing) return <AuthSplash />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (hasAccess) return <Navigate to={`/app/subscription${location.search}`} replace />

  return <Outlet />
}

/** Keeps signed-in users out of the auth screens. */
export function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) return <AuthSplash />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return <Outlet />
}
