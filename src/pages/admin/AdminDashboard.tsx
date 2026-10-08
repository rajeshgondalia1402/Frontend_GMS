import {
  AlarmClock,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  PieChart,
  RefreshCw,
  Wallet,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ActionCenter } from '@/components/admin/ActionCenter'
import { BreakdownCard, share } from '@/components/admin/BreakdownCard'
import { GrowthChart } from '@/components/admin/GrowthChart'
import { SummaryCard } from '@/components/dashboard'
import type { SummaryTone } from '@/components/dashboard'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { useAdminDashboardSummary } from '@/hooks/useAdminDashboardSummary'
import { formatCount } from '@/lib/dashboard'
import { formatCurrency } from '@/lib/utils'
import type { AdminDashboardSummary } from '@/types/admin'

/** The mix wears the tiles' colours: paid violet, trial sky, expired red (validated). */
const MIX_COLORS = { paid: '#7c3aed', trial: '#0284c7', expired: '#ef4444' }
/** Monthly in the app's blue, yearly in teal — a validated pair. */
const REVENUE_COLORS = { monthly: '#3366ff', yearly: '#0d9488' }

interface Tile {
  label: string
  icon: LucideIcon
  tone: SummaryTone
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
    hint: () => 'Every registered garage',
  },
  {
    label: 'Active',
    icon: CheckCircle2,
    tone: 'success',
    value: (s) => formatCount(s.activeGarages),
    hint: (s) => `${share(s.activeGarages, s.totalGarages)} of all garages`,
    to: '/admin/reports',
    newTab: true,
  },
  {
    label: 'Paid',
    icon: CreditCard,
    tone: 'violet',
    value: (s) => formatCount(s.paidGarages),
    hint: (s) => `${share(s.paidGarages, s.activeGarages)} of active`,
  },
  {
    label: 'Free Trial',
    icon: Clock,
    tone: 'info',
    value: (s) => formatCount(s.freeTrial),
    hint: (s) => `${share(s.freeTrial, s.activeGarages)} of active`,
  },
  {
    label: 'Expiring Soon',
    icon: AlarmClock,
    tone: 'warning',
    value: (s) => formatCount(s.expiringSoon),
    hint: () => 'Within the next 7 days',
  },
  {
    label: 'Expired',
    icon: XCircle,
    tone: 'danger',
    value: (s) => formatCount(s.expiredGarages),
    hint: (s) => `${share(s.expiredGarages, s.totalGarages)} of all garages`,
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
  const { admin } = useAdminAuth()
  const { summary, loading, error, reload } = useAdminDashboardSummary()

  const totalRevenue = summary ? summary.monthlyRevenue + summary.yearlyRevenue : 0

  return (
    <div className="space-y-6">
      {/* Platform health, and the follow-ups the numbers call for. */}
      <ActionCenter adminName={admin?.name} summary={summary} loading={loading} />

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
            <SummaryCard
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
        <SectionHeading title="Subscriptions" caption="How the platform splits, and what it has earned" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <BreakdownCard
            title="Subscription Mix"
            caption="Every garage, by where its subscription stands"
            icon={PieChart}
            total={summary ? formatCount(summary.totalGarages) : '—'}
            totalLabel="Garages in total"
            loading={loading}
            parts={[
              {
                label: 'Paid',
                value: summary?.paidGarages ?? 0,
                display: formatCount(summary?.paidGarages),
                color: MIX_COLORS.paid,
                hint: 'Monthly or yearly',
              },
              {
                label: 'Free trial',
                value: summary?.freeTrial ?? 0,
                display: formatCount(summary?.freeTrial),
                color: MIX_COLORS.trial,
              },
              {
                label: 'Expired',
                value: summary?.expiredGarages ?? 0,
                display: formatCount(summary?.expiredGarages),
                color: MIX_COLORS.expired,
                hint: 'Run out or cancelled',
              },
            ]}
          />
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
      </section>

      <section>
        <SectionHeading title="Growth" caption="Garages and paid subscriptions over the year" />
        <GrowthChart />
      </section>
    </div>
  )
}
