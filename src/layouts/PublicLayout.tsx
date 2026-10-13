import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PublicFooter, PublicHeader } from '@/components/public'

/**
 * The shell every public marketing page sits in.
 *
 * It is deliberately **not** `AppShell`: these pages carry no sidebar, no
 * bottom bar and no session chrome, and they must stay reachable whether or
 * not anyone is signed in — so they also sit outside `PublicOnlyRoute`, which
 * exists to keep a signed-in owner off the auth screens.
 */
export function PublicLayout() {
  const { pathname } = useLocation()

  // A router navigation keeps the old scroll position, which on a long landing
  // page means the next page opens halfway down it.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <PublicHeader />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  )
}
