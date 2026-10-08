import { Link } from 'react-router-dom'
import { AlarmClock, ArrowRight, CalendarDays, PartyPopper, Sparkles, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatCount } from '@/lib/dashboard'
import { cn, formatDayMonthYear, getGreeting } from '@/lib/utils'
import type { AdminDashboardSummary } from '@/types/admin'

interface Action {
  key: string
  count: number
  title: string
  detail: string
  /** The garage list, already narrowed to exactly these garages. */
  to: string
  icon: LucideIcon
  tone: string
  iconTone: string
}

/** What needs the admin today, most urgent first; anything at zero drops out. */
function actionsFor(s: AdminDashboardSummary): Action[] {
  const actions: Action[] = [
    {
      key: 'expiring',
      count: s.expiringSoon,
      title: 'Renew before they lapse',
      detail: 'Subscriptions ending in the next 7 days',
      to: '/admin/garages?state=expiring',
      icon: AlarmClock,
      tone: 'hover:border-amber-300 hover:bg-amber-50/50',
      iconTone: 'bg-amber-100 text-amber-700',
    },
    {
      key: 'trial',
      count: s.freeTrial,
      title: 'Convert trials to paid',
      detail: 'Garages live on the free trial',
      to: '/admin/garages?state=live&plan=FREE_TRIAL',
      icon: Sparkles,
      tone: 'hover:border-sky-300 hover:bg-sky-50/50',
      iconTone: 'bg-sky-100 text-sky-700',
    },
    {
      key: 'expired',
      count: s.expiredGarages,
      title: 'Win back expired',
      detail: 'Subscription run out or cancelled',
      to: '/admin/garages?state=expired',
      icon: UserX,
      tone: 'hover:border-red-300 hover:bg-red-50/50',
      iconTone: 'bg-red-100 text-red-700',
    },
  ]
  return actions.filter((action) => action.count > 0)
}

/**
 * The share of garages that are live, as a ring. One value against its whole,
 * so a single arc on a grey track — the figure in the middle says it exactly.
 */
function HealthRing({ active, total }: { active: number; total: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? active / total : 0

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#059669"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none text-slate-900">
          {total > 0 ? `${Math.round(ratio * 100)}%` : '—'}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Live
        </span>
      </div>
    </div>
  )
}

interface ActionCenterProps {
  adminName?: string | null
  summary: AdminDashboardSummary | null
  loading: boolean
}

/**
 * The top of the admin dashboard: how healthy the platform is right now, and
 * the follow-ups the numbers call for, each one click from the garages behind it.
 */
export function ActionCenter({ adminName, summary, loading }: ActionCenterProps) {
  const actions = summary ? actionsFor(summary) : []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-5">
        <div className="flex min-w-0 items-center gap-4">
          {loading || !summary ? (
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-slate-100" />
          ) : (
            <HealthRing active={summary.activeGarages} total={summary.totalGarages} />
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDayMonthYear(new Date())}
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
              {getGreeting()}, {adminName ?? 'Admin'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {summary ? (
                <>
                  <span className="font-semibold text-slate-700">
                    {formatCount(summary.activeGarages)} of {formatCount(summary.totalGarages)}
                  </span>{' '}
                  garages are live right now.
                </>
              ) : (
                'Checking on your garages…'
              )}
            </p>
          </div>
        </div>

        <div className="min-w-0 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Needs your attention
          </p>
          {loading ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[0, 1, 2].map((n) => (
                <div key={n} className="h-[74px] animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : actions.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <PartyPopper className="h-5 w-5 shrink-0" />
              All clear — no garage needs following up today.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {actions.map((action) => (
                <Link
                  key={action.key}
                  to={action.to}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 transition-colors',
                    action.tone,
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      action.iconTone,
                    )}
                  >
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold leading-none text-slate-900">
                        {formatCount(action.count)}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-700">
                        {action.title}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 sm:truncate">{action.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
