import {
  AlarmClock,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Wallet,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BreakdownCard, share } from '@/components/admin/BreakdownCard'
import { ExpiringTrialsPanel } from '@/components/admin/ExpiringTrialsPanel'
import { GrowthChart } from '@/components/admin/GrowthChart'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import type { AdminStatTone } from '@/components/admin/AdminStatCard'
import { useAdminDashboardSummary } from '@/hooks/useAdminDashboardSummary'
import { formatCount } from '@/lib/dashboard'
import { formatCurrency } from '@/lib/utils'
import type { AdminDashboardSummary } from '@/types/admin'

/** Monthly in the app's blue, yearly in teal — a validated pair. */
const REVENUE_COLORS = { monthly: '#3366ff', yearly: '#0d9488' }

interface Tile {
  label: string
  icon: LucideIcon
  tone: AdminStatTone
  value: (s: AdminDashboardSummary) => string
  hint: (s: AdminDashboardSummary) => string
  /** Where the tile's garages are listed. Without it the tile is static. */
  to?: string
  /** Opens `to` in a new tab, so the dashboard stays where it was. */
  newTab?: boolean
}

const GARAGE_TILES: Tile[] = [
  {
    label: 'Total Garages',
    icon: Building2,
    tone: 'primary',
    value: (s) => formatCount(s.totalGarages),
    hint: () => 'All registered',
    // Reports → Garage Subscriptions: every garage with its subscription.
    to: '/admin/garages',
    newTab: true,
  },
  {
    label: 'Active',
    icon: CheckCircle2,
    tone: 'success',
    value: (s) => formatCount(s.activeGarages),
    hint: (s) => `${share(s.activeGarages, s.totalGarages)} of all garages`,
    to: '/admin/reports/active-garages',
    newTab: true,
  },
  {
    label: 'Paid',
    icon: CreditCard,
    tone: 'violet',
    value: (s) => formatCount(s.paidGarages),
    hint: (s) => `${share(s.paidGarages, s.activeGarages)} of active`,
    // Reports → Active Garages, opened on Paid (monthly + yearly).
    to: '/admin/reports/active-garages?plan=PAID',
    newTab: true,
  },
  {
    label: 'Free Trial',
    icon: Clock,
    tone: 'info',
    value: (s) => formatCount(s.freeTrial),
    hint: (s) => `${share(s.freeTrial, s.activeGarages)} of active`,
    // Reports → Active Garages, opened on its Free Trial tab.
    to: '/admin/reports/active-garages?plan=FREE_TRIAL',
    newTab: true,
  },
  {
    label: 'Expiring Soon',
    icon: AlarmClock,
    tone: 'warning',
    value: (s) => formatCount(s.expiringSoon),
    hint: () => 'Next 7 days',
    // Reports → Garage Subscriptions, on its "Expiring in 7 days" filter.
    to: '/admin/garages?state=expiring',
    newTab: true,
  },
  {
    label: 'Expired',
    icon: XCircle,
    tone: 'danger',
    value: (s) => formatCount(s.expiredGarages),
    hint: (s) => `${share(s.expiredGarages, s.totalGarages)} of all garages`,
    // Reports → Garage Subscriptions, on its "Expired" filter.
    to: '/admin/garages?state=expired',
    newTab: true,
  },
]

function SectionHeading({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <span className="truncate text-xs text-slate-400">{caption}</span>
    </div>
  )
}

export function AdminDashboard() {
  const { summary, loading, error, reload } = useAdminDashboardSummary()

  const totalRevenue = summary ? summary.monthlyRevenue + summary.yearlyRevenue : 0

  return (
    <div className="space-y-6">
      {/* The counts come back together, so one failure is one message. */}
      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <section>
        <SectionHeading title="Garages" caption="Where every garage stands on its subscription" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {GARAGE_TILES.map((tile) => (
            <AdminStatCard
              key={tile.label}
              label={tile.label}
              icon={tile.icon}
              tone={tile.tone}
              loading={loading}
              value={summary ? tile.value(summary) : '—'}
              hint={summary ? tile.hint(summary) : undefined}
              to={tile.to}
              newTab={tile.newTab}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Subscriptions"
          caption="How the platform has grown, what it has earned, and trials to follow up"
        />
        {/* The growth chart and revenue sit side by side (two thirds / one
            third, matched in height); trials ending soon run full width below.
            Below lg everything stacks. */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2 [&>div]:h-full">
            <GrowthChart />
          </div>

          <div className="min-w-0 [&>div]:h-full">
            <BreakdownCard
              title="Subscription Revenue"
              caption="Paid plans sold, all time"
              icon={Wallet}
              total={summary ? formatCurrency(totalRevenue) : '—'}
              totalLabel="Total earned from paid plans"
              loading={loading}
              parts={[
                {
                  label: 'Monthly plans',
                  value: summary?.monthlyRevenue ?? 0,
                  display: summary ? formatCurrency(summary.monthlyRevenue) : '—',
                  color: REVENUE_COLORS.monthly,
                },
                {
                  label: 'Yearly plans',
                  value: summary?.yearlyRevenue ?? 0,
                  display: summary ? formatCurrency(summary.yearlyRevenue) : '—',
                  color: REVENUE_COLORS.yearly,
                },
              ]}
              footnote="Each subscription sold is valued at its plan's current price."
            />
          </div>

          <div className="min-w-0 lg:col-span-3">
            <ExpiringTrialsPanel />
          </div>
        </div>
      </section>
    </div>
  )
}
