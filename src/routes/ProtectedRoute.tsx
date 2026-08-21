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

/** Blocks the owner panel until a valid (non-expired) session exists. */
export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <AuthSplash />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

/** Keeps signed-in users out of the auth screens. */
export function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) return <AuthSplash />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return <Outlet />
}
