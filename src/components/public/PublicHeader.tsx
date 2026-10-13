import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'

/** The public site's own menu — nothing here is behind a session. */
export const publicNav = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Subscription', to: '/subscription' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
]

const LINK_BASE =
  'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // The session is read so a signed-in owner is offered their dashboard
  // instead of being asked to log in again. Nothing else about the existing
  // auth flow changes.
  const { isAuthenticated, initializing } = useAuth()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandMark />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {publicNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  LINK_BASE,
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {/* Held empty for the one tick it takes to read the stored session,
              so the header does not flash Login at an owner who is signed in. */}
          {initializing ? (
            <div className="h-11 w-48" aria-hidden="true" />
          ) : isAuthenticated ? (
            <Link to="/app">
              <Button leftIcon={<LayoutDashboard className="h-4 w-4" />}>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className={cn(LINK_BASE, 'text-slate-700 hover:bg-slate-100')}>
                Login
              </Link>
              <Link to="/register">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Start Free Trial</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="public-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="public-menu" className="border-t border-slate-200 bg-white lg:hidden">
          <nav aria-label="Main" className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <ul className="space-y-1">
              {publicNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-700 hover:bg-slate-100',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {!initializing && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {isAuthenticated ? (
                  <Link to="/app" className="block">
                    <Button fullWidth size="lg" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="block">
                      <Button fullWidth size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Start Free Trial
                      </Button>
                    </Link>
                    <Link to="/login" className="block">
                      <Button fullWidth size="lg" variant="outline">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
