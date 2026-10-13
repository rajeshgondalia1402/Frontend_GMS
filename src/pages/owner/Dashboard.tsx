import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CarFront,
  ClipboardList,
  Clock,
  FilePlus2,
  IndianRupee,
  RefreshCw,
  UserPlus,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SubscriptionBanner } from '@/components/common/SubscriptionBanner'
import {
  MonthlyCharts,
  JobCardsPanel,
  NewCustomersPanel,
  VehiclesPanel,
  SummaryCard,
} from '@/components/dashboard'
import type {
  JobCardsPanelVariant,
  SummaryTone,
  VehiclesPanelVariant,
} from '@/components/dashboard'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { formatCount, monthLabel } from '@/lib/dashboard'
import { formatCurrency, getGreeting, getInitial } from '@/lib/utils'
import { getSubscriptionView } from '@/lib/subscription'
import type { DashboardSummary } from '@/types/dashboard'

/** One tile, as the three rows below describe theirs. */
interface Tile {
  label: string
  icon: LucideIcon
  tone: SummaryTone
  /** Read off the summary once it is in; the tiles paint before it arrives. */
  value: (summary: DashboardSummary) => string
  hint?: string
  to?: string
  /** Opens `to` in a new tab — the revenue tiles open their report there. */
  newTab?: boolean
  /** Opens its rows in a panel on the dashboard instead of linking away. */
  panel?: DashboardPanel
}

/**
 * The lists a tile can open under the tiles. Only the open one is mounted, so
 * clicking a tile calls that tile's API and no other.
 */
type DashboardPanel =
  | 'newCustomers'
  | 'newVehicles'
  | 'newJobCards'
  | 'pendingVehicles'
  | 'inService'
  | 'unpaidBills'
  | 'partiallyPaid'

/** The tiles whose rows are vehicles, and which vehicles each one lists. */
const VEHICLE_PANELS: Partial<Record<DashboardPanel, VehiclesPanelVariant>> = {
  newVehicles: 'new',
  pendingVehicles: 'pending',
  inService: 'inService',
}

/** The tiles whose rows are job cards, and which job cards each one lists. */
const JOB_CARD_PANELS: Partial<Record<DashboardPanel, JobCardsPanelVariant>> = {
  newJobCards: 'new',
  unpaidBills: 'unpaid',
  partiallyPaid: 'partial',
}

/** The money the garage has collected, counted from the day it opened. */
const TOTAL_TILES: Tile[] = [
  {
    label: 'Total Revenue',
    icon: Wallet,
    tone: 'success',
    value: (s) => formatCurrency(s.revenue.total),
    hint: 'Collected, not billed',
    to: '/app/reports/total-revenue',
    newTab: true,
  },
]

/** The same four figures, counted from the first of the month to this moment. */
const MONTH_TILES: Tile[] = [
  {
    label: 'New Customers',
    icon: UserPlus,
    tone: 'primary',
    value: (s) => formatCount(s.customers.thisMonth),
    hint: 'Added this month',
    panel: 'newCustomers',
  },
  {
    label: 'New Vehicles',
    icon: CarFront,
    tone: 'info',
    value: (s) => formatCount(s.vehicles.thisMonth),
    hint: 'Added this month',
    panel: 'newVehicles',
  },
  {
    label: 'New Job Cards',
    icon: FilePlus2,
    tone: 'violet',
    value: (s) => formatCount(s.jobCards.thisMonth),
    hint: 'Opened this month',
    panel: 'newJobCards',
  },
  {
    label: 'Revenue This Month',
    icon: IndianRupee,
    tone: 'success',
    value: (s) => formatCurrency(s.revenue.thisMonth),
    hint: 'Collected this month',
    to: '/app/reports/revenue-this-month',
    newTab: true,
  },
]

/**
 * What is still waiting on the garage. All time rather than this month: a bill
 * left unpaid in March is still owed in September, and a vehicle nobody has
 * started on does not stop waiting because the month turned over.
 */
const ATTENTION_TILES: Tile[] = [
  {
    label: 'Pending Vehicles',
    icon: Clock,
    tone: 'warning',
    value: (s) => formatCount(s.vehicles.pending),
    hint: 'Waiting to be worked on',
    panel: 'pendingVehicles',
  },
  {
    label: 'In Service',
    icon: Wrench,
    tone: 'info',
    value: (s) => formatCount(s.vehicles.inService),
    hint: 'On the ramp right now',
    panel: 'inService',
  },
  {
    label: 'Unpaid Bills',
    icon: AlertCircle,
    tone: 'danger',
    value: (s) => formatCount(s.jobCards.unpaid),
    hint: 'Nothing collected yet',
    panel: 'unpaidBills',
  },
  {
    label: 'Partially Paid',
    icon: ClipboardList,
    tone: 'warning',
    value: (s) => formatCount(s.jobCards.partiallyPaid),
    hint: 'Part of the bill still owing',
    panel: 'partiallyPaid',
  },
]

/** The first row: revenue all time and this month, then this month's new customers and vehicles. */
const HEADLINE_TILES: Tile[] = [...TOTAL_TILES, MONTH_TILES[3], MONTH_TILES[0], MONTH_TILES[1]]

/** The second row: this month's new job cards, then the work still waiting on the garage. */
const ACTIVITY_TILES: Tile[] = [MONTH_TILES[2], ...ATTENTION_TILES]

export function Dashboard() {
  const { user, session } = useAuth()
  const subscriptionView = getSubscriptionView(session?.subscription ?? null)

  /** Every figure at the top of the screen, in one request. */
  const { summary, loading: loadingSummary, error: summaryError, reload } = useDashboardSummary()

  /** The tile whose rows are open under the tiles — new customers on landing. */
  const [panel, setPanel] = useState<DashboardPanel | null>('newCustomers')
  const togglePanel = (next: DashboardPanel) => {
    const opening = panel !== next
    setPanel(opening ? next : null)
    // Only when a list opens - closing one has nothing to scroll to.
    if (opening) setScrollRequest((n) => n + 1)
  }

  /**
   * Brings the list into view once a tile opens it. The list mounts on the
   * render after the click, so the scroll waits for that render rather than
   * happening in the click handler. Never on landing: the count starts at 0.
   */
  const panelRef = useRef<HTMLDivElement>(null)
  const [scrollRequest, setScrollRequest] = useState(0)

  useEffect(() => {
    if (scrollRequest === 0) return
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [scrollRequest])
  const vehicleVariant = panel ? VEHICLE_PANELS[panel] : undefined
  const jobCardVariant = panel ? JOB_CARD_PANELS[panel] : undefined

  /** One row of tiles, under the heading that says what they are counted over. */
  const section = (title: string, caption: string, tiles: Tile[]) => (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className="truncate text-xs text-slate-400">{caption}</span>
      </div>
      <div
        className={
          tiles.length === 4
            ? 'grid grid-cols-2 gap-3 lg:grid-cols-4'
            : 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'
        }
      >
        {tiles.map((tile) => (
          <SummaryCard
            key={tile.label}
            label={tile.label}
            icon={tile.icon}
            tone={tile.tone}
            hint={tile.hint}
            to={tile.to}
            newTab={tile.newTab}
            onClick={tile.panel ? () => togglePanel(tile.panel as DashboardPanel) : undefined}
            active={tile.panel !== undefined && tile.panel === panel}
            loading={loadingSummary}
            value={summary ? tile.value(summary) : '—'}
          />
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-6">
      {/* Greeting — owner name, garage name and avatar initial come from the
          login response — with the plan the garage is on beside it. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {getInitial(user?.ownerName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-500">
              {getGreeting()}, {user?.ownerName ?? 'there'} 👋
            </p>
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {user?.garageName ?? 'Your Garage'}
            </h1>
          </div>
        </div>

        {/* Wide enough for the days left and the button on one line, and no
            wider — the greeting keeps the rest of the row. */}
        <div className="w-full shrink-0 lg:max-w-md">
          <SubscriptionBanner view={subscriptionView} />
        </div>
      </div>

      {/* The figures come back together, so one failure is one message rather
          than twelve tiles each saying the same thing. */}
      {summaryError && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="min-w-0 flex-1 text-sm text-red-700">{summaryError}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {section('Overview', 'Revenue, plus new customers and vehicles this month', HEADLINE_TILES)}
      {section(
        `${monthLabel(summary?.month)} & Needs Attention`,
        'Job cards opened this month, and work still open',
        ACTIVITY_TILES,
      )}

      {/* scroll-mt clears the sticky top bar (h-16), so the list's header is
          not hidden under it once it has been scrolled to. */}
      <div ref={panelRef} className="scroll-mt-20">
        {panel === 'newCustomers' && <NewCustomersPanel />}
        {/* Keyed by tile, so switching between two lists of the same kind
            starts the new one on its own first page. */}
        {vehicleVariant && <VehiclesPanel key={panel} variant={vehicleVariant} />}
        {jobCardVariant && <JobCardsPanel key={panel} variant={jobCardVariant} />}
      </div>

      <MonthlyCharts />
    </div>
  )
}
