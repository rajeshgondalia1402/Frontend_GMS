import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Car,
  CarFront,
  ChevronRight,
  ClipboardList,
  Clock,
  FilePlus2,
  IndianRupee,
  RefreshCw,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SubscriptionBanner } from '@/components/common/SubscriptionBanner'
import { SummaryCard } from '@/components/dashboard'
import type { SummaryTone } from '@/components/dashboard'
import { Badge, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { jobCardService } from '@/services/jobCardService'
import { ApiError } from '@/services/httpClient'
import { jobCardStatusLabel, jobCardStatusTone, vehicleDisplayName } from '@/lib/jobCard'
import { formatCount, monthLabel } from '@/lib/dashboard'
import { formatCurrency, getGreeting, getInitial } from '@/lib/utils'
import { getSubscriptionView } from '@/lib/subscription'
import type { DashboardSummary } from '@/types/dashboard'
import type { JobCardRecord } from '@/types/jobCard'

/** One tile, as the three rows below describe theirs. */
interface Tile {
  label: string
  icon: LucideIcon
  tone: SummaryTone
  /** Read off the summary once it is in; the tiles paint before it arrives. */
  value: (summary: DashboardSummary) => string
  hint?: string
  to?: string
}

/** What the garage has on its books, counted from the day it opened. */
const TOTAL_TILES: Tile[] = [
  {
    label: 'Total Customers',
    icon: Users,
    tone: 'primary',
    value: (s) => formatCount(s.customers.total),
    hint: 'On the books',
    to: '/app/customers',
  },
  {
    label: 'Total Vehicles',
    icon: Car,
    tone: 'info',
    value: (s) => formatCount(s.vehicles.total),
    hint: 'On the books',
    to: '/app/vehicles',
  },
  {
    label: 'Total Job Cards',
    icon: Wrench,
    tone: 'violet',
    value: (s) => formatCount(s.jobCards.total),
    hint: 'Opened all time',
    to: '/app/job-cards',
  },
  {
    label: 'Total Revenue',
    icon: Wallet,
    tone: 'success',
    value: (s) => formatCurrency(s.revenue.total),
    hint: 'Collected, not billed',
    to: '/app/reports',
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
    to: '/app/customers',
  },
  {
    label: 'New Vehicles',
    icon: CarFront,
    tone: 'info',
    value: (s) => formatCount(s.vehicles.thisMonth),
    hint: 'Added this month',
    to: '/app/vehicles',
  },
  {
    label: 'New Job Cards',
    icon: FilePlus2,
    tone: 'violet',
    value: (s) => formatCount(s.jobCards.thisMonth),
    hint: 'Opened this month',
    to: '/app/job-cards',
  },
  {
    label: 'Revenue This Month',
    icon: IndianRupee,
    tone: 'success',
    value: (s) => formatCurrency(s.revenue.thisMonth),
    hint: 'Collected this month',
    to: '/app/reports',
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
    to: '/app/vehicles',
  },
  {
    label: 'In Service',
    icon: Wrench,
    tone: 'info',
    value: (s) => formatCount(s.vehicles.inService),
    hint: 'On the ramp right now',
    to: '/app/vehicles',
  },
  {
    label: 'Unpaid Bills',
    icon: AlertCircle,
    tone: 'danger',
    value: (s) => formatCount(s.jobCards.unpaid),
    hint: 'Nothing collected yet',
    to: '/app/job-cards',
  },
  {
    label: 'Partially Paid',
    icon: ClipboardList,
    tone: 'warning',
    value: (s) => formatCount(s.jobCards.partiallyPaid),
    hint: 'Part of the bill still owing',
    to: '/app/job-cards',
  },
]

export function Dashboard() {
  const { user, session } = useAuth()
  const subscriptionView = getSubscriptionView(session?.subscription ?? null)

  /** Every figure at the top of the screen, in one request. */
  const { summary, loading: loadingSummary, error: summaryError, reload } = useDashboardSummary()

  /**
   * The four newest cards of this garage, from the API. They have to be the
   * real rows rather than a sample: each one links to its own card, and an id
   * the API never issued opens a detail screen that can only fail.
   */
  const [recent, setRecent] = useState<JobCardRecord[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [jobsError, setJobsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    jobCardService
      .listJobCards({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((data) => {
        if (cancelled) return
        setRecent(data.jobCards)
        setLoadingJobs(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setJobsError(cause instanceof ApiError ? cause.message : 'Could not load job cards.')
        setLoadingJobs(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /** One row of four tiles, under the heading that says what they are counted over. */
  const section = (title: string, caption: string, tiles: Tile[]) => (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className="truncate text-xs text-slate-400">{caption}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <SummaryCard
            key={tile.label}
            label={tile.label}
            icon={tile.icon}
            tone={tile.tone}
            hint={tile.hint}
            to={tile.to}
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

      {section('Overall', 'Since the garage opened', TOTAL_TILES)}
      {section(monthLabel(summary?.month), 'From the 1st to today', MONTH_TILES)}
      {section('Needs Attention', 'All time, not just this month', ATTENTION_TILES)}

      {/* Recent job cards */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent Job Cards</h2>
          <Link
            to="/app/job-cards"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {loadingJobs ? (
            [0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-[74px] rounded-xl" />)
          ) : jobsError ? (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-red-600 shadow-card">
              {jobsError}
            </p>
          ) : recent.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card">
              No job cards yet.{' '}
              <Link
                to="/app/job-cards/new"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Open the first one
              </Link>
              .
            </p>
          ) : (
            recent.map((job) => (
              <Link
                key={job.id}
                to={`/app/job-cards/${job.id}`}
                // Handed over so the card's own screen paints before its
                // request comes back, the same way the list does it.
                state={{ jobCard: job }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{job.jobNumber}</span>
                    <Badge tone={jobCardStatusTone(job.status)}>
                      {jobCardStatusLabel(job.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {job.vehicle ? vehicleDisplayName(job.vehicle) : '—'} ·{' '}
                    {job.vehicle?.customer?.fullName ?? '—'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(job.totalAmount)}
                  </p>
                  <ChevronRight className="ml-auto mt-1 h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
