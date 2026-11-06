import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthShowcase, AuthShowcaseCompact } from '@/components/auth/AuthShowcase'
import type { ShowcaseCopy } from '@/components/auth/AuthShowcase'

const COPY: Record<string, ShowcaseCopy> = {
  '/login': {
    eyebrow: 'Welcome back',
    title: 'Your workshop, right where you left it.',
    subtitle: 'Pick up every open job card, pending payment and customer exactly where your team left them.',
  },
  '/register': {
    eyebrow: '30-day free trial',
    title: 'Run your whole garage from one dashboard.',
    subtitle: 'Job cards, billing, customers, staff and reports — set up in minutes, built for busy service bays.',
  },
  '/forgot-password': {
    eyebrow: 'Account recovery',
    title: "Locked out? We'll get you back on the floor.",
    subtitle: 'Verify your mobile number with a one-time code and set a new password in under a minute.',
  },
  '/reset-password': {
    eyebrow: 'Account recovery',
    title: "Locked out? We'll get you back on the floor.",
    subtitle: 'Verify your mobile number with a one-time code and set a new password in under a minute.',
  },
  '/plans': {
    eyebrow: 'Subscription',
    title: 'Keep your garage running without a break.',
    subtitle: 'Your customers, vehicles and job cards are safe. Pick a plan and carry on right where you stopped.',
  },
}

/**
 * Sign in, sign up, password recovery and plan selection.
 *
 * Desktop (lg+): split screen — the brand / product panel on the left, the form
 * on the right. Smaller screens: a compact brand header with the form as a
 * card overlapping it, so the form is always the first thing in reach.
 */
export function AuthLayout() {
  const { pathname } = useLocation()
  const copy = COPY[pathname] ?? COPY['/login']

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Left: brand panel (desktop) */}
      <aside className="sticky top-0 hidden h-screen lg:block">
        <AuthShowcase copy={copy} />
      </aside>

      {/* Right: the form */}
      <main className="flex min-h-screen flex-col bg-slate-50 lg:bg-white">
        <AuthShowcaseCompact copy={copy} className="lg:hidden" />

        <div className="hidden items-center justify-end px-10 pt-8 lg:flex">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to website
          </Link>
        </div>

        <div className="flex flex-1 items-start justify-center px-4 lg:items-center lg:px-10 lg:py-10">
          <div className="-mt-6 w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70 sm:p-8 lg:mt-0 lg:rounded-none lg:p-0 lg:shadow-none lg:ring-0">
            <Outlet />
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row lg:px-10">
          <span>© 2026 GaragePilot. All rights reserved.</span>
          <Link to="/" className="font-medium text-slate-500 hover:text-primary-600 lg:hidden">
            Back to website
          </Link>
        </footer>
      </main>
    </div>
  )
}
