import { Link } from 'react-router-dom'
import { AlertTriangle, Sparkles, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { formatDayCount, getSubscriptionView } from '@/lib/subscription'
import type { SubscriptionStatus } from '@/types'
import { cn } from '@/lib/utils'

/** Same palette and icons as the dashboard's SubscriptionBanner. */
const tones: Record<SubscriptionStatus, { icon: LucideIcon; wrap: string; icon_: string; title: string; sub: string }> = {
  trial: {
    icon: Sparkles,
    wrap: 'border-sky-200 bg-sky-50 hover:bg-sky-100',
    icon_: 'text-sky-500',
    title: 'text-sky-800',
    sub: 'text-sky-600',
  },
  active: {
    icon: Sparkles,
    wrap: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
    icon_: 'text-emerald-500',
    title: 'text-emerald-800',
    sub: 'text-emerald-600',
  },
  expiring: {
    icon: AlertTriangle,
    wrap: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
    icon_: 'text-amber-500',
    title: 'text-amber-800',
    sub: 'text-amber-600',
  },
  expired: {
    icon: XCircle,
    wrap: 'border-red-200 bg-red-50 hover:bg-red-100',
    icon_: 'text-red-500',
    title: 'text-red-800',
    sub: 'text-red-600',
  },
}

/**
 * Compact plan + days-remaining badge shown in the topbar. Hidden when there is
 * no subscription on the session (e.g. the admin panel).
 */
export function SubscriptionPill() {
  const { session } = useAuth()
  if (!session?.subscription) return null

  const { status, daysRemaining, planLabel } = getSubscriptionView(session.subscription)
  const { icon: Icon, wrap, icon_, title, sub } = tones[status]
  const remaining = status === 'expired' ? 'Expired' : `${formatDayCount(daysRemaining)} remaining`

  return (
    <Link
      to="/app/subscription"
      title={`${planLabel} · ${remaining}`}
      className={cn(
        'flex h-10 items-center gap-2 rounded-lg border px-2.5 transition-colors sm:px-3',
        wrap,
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', icon_)} />
      <span className="hidden min-w-0 leading-tight sm:block">
        <span className={cn('block truncate text-xs font-semibold', title)}>{planLabel}</span>
        <span className={cn('block truncate text-[11px]', sub)}>{remaining}</span>
      </span>
      {/* Mobile: keep it to the number so the topbar stays uncluttered */}
      <span className={cn('text-xs font-semibold sm:hidden', title)}>
        {status === 'expired' ? 'Expired' : `${daysRemaining}d`}
      </span>
    </Link>
  )
}
