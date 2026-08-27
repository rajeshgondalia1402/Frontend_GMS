import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAdminAuth } from '@/context/AdminAuthContext'

/** Shown for the one tick it takes to read the stored session. */
function AdminSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <Loader2 className="h-6 w-6 animate-spin text-white" aria-label="Loading" />
    </div>
  )
}

/**
 * Blocks the admin panel until a valid (non-expired) admin session exists.
 * A garage owner's session counts for nothing here — the two are separate
 * accounts on separate tokens.
 */
export function AdminProtectedRoute() {
  const { isAuthenticated, initializing } = useAdminAuth()
  const location = useLocation()

  if (initializing) return <AdminSplash />

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
    )
  }

  return <Outlet />
}

/** Keeps a signed-in admin off the admin sign-in screen. */
export function AdminPublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAdminAuth()

  if (initializing) return <AdminSplash />
  if (isAuthenticated) return <Navigate to="/admin" replace />

  return <Outlet />
}
