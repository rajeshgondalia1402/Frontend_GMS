import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Mail, Menu, Phone, X } from 'lucide-react'
import { Button, WhatsappIcon } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/publicContact'
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
  'relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

const TOPBAR_LINK =
  'inline-flex items-center gap-1.5 rounded transition-colors hover:text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  // The session is read so a signed-in owner is offered their dashboard
  // instead of being asked to log in again. Nothing else about the existing
  // auth flow changes.
  const { isAuthenticated, initializing } = useAuth()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40">
      {/* Contact strip — the number and inbox a garage owner looks for first. */}
      <div className="bg-primary-950 text-xs text-blue-100/90">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <a href={CONTACT_PHONE_HREF} className={TOPBAR_LINK}>
              <Phone aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">{CONTACT_PHONE_DISPLAY}</span>
            </a>
            <a href={CONTACT_EMAIL_HREF} className={cn(TOPBAR_LINK, 'hidden min-w-0 sm:inline-flex')}>
              <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="truncate font-medium">{CONTACT_EMAIL}</span>
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden font-medium text-blue-100/70 md:inline">
              Smart Garage Management
            </span>
            <a
              href={CONTACT_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(TOPBAR_LINK, 'font-semibold text-emerald-300')}
            >
              <WhatsappIcon className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'border-b bg-white/95 backdrop-blur transition-shadow',
          scrolled ? 'border-slate-200 shadow-md shadow-primary-950/5' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <BrandMark />

          <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    LINK_BASE,
                    isActive
                      ? 'text-primary-700 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-brand-flame'
                      : 'text-slate-600 hover:text-primary-700',
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
                <Link
                  to="/login"
                  className={cn(LINK_BASE, 'text-primary-800 hover:bg-primary-50')}
                >
                  Login
                </Link>
                <Link to="/register">
                  <Button variant="accent" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Start Free Trial
                  </Button>
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
            className="flex h-11 w-11 items-center justify-center rounded-lg text-primary-900 transition-colors hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div
            id="public-menu"
            className="max-h-[calc(100vh-6.25rem)] overflow-y-auto border-t border-slate-200 bg-white animate-fade-in lg:hidden"
          >
            <nav aria-label="Main" className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
              <ul className="space-y-1">
                {publicNav.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-[44px] items-center rounded-lg border-l-4 px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                          isActive
                            ? 'border-accent-500 bg-primary-50 text-primary-800'
                            : 'border-transparent text-slate-700 hover:bg-slate-50',
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
                        <Button
                          fullWidth
                          size="lg"
                          variant="accent"
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
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

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <a
                  href={CONTACT_PHONE_HREF}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-50 text-sm font-semibold text-primary-800"
                >
                  <Phone aria-hidden="true" className="h-4 w-4" /> Call us
                </a>
                <a
                  href={CONTACT_EMAIL_HREF}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent-50 text-sm font-semibold text-accent-800"
                >
                  <Mail aria-hidden="true" className="h-4 w-4" /> Email us
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
