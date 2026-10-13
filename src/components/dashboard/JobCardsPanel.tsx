import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  HardHat,
  ListChecks,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useDashboardPage } from '@/hooks/useDashboardPage'
import {
  getDashboardNewJobCards,
  getDashboardPartiallyPaidBills,
  getDashboardUnpaidBills,
} from '@/services/dashboardService'
import { monthLabel } from '@/lib/dashboard'
import { formatServiceDate, jobCardStatusLabel, jobCardStatusTone } from '@/lib/jobCard'
import { paidBarClass, paidPercent, paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import { cn, formatCurrency } from '@/lib/utils'
import type { DashboardJobCardsPage, DashboardNewJobCard } from '@/types/dashboard'
import {
  Avatar,
  ListPanel,
  NEW_TAB,
  PANEL_PAGE_SIZE,
  openInNewTab,
  panelRowHover,
} from './ListPanel'
import type { ListPanelTone } from './ListPanel'

/** `Hyundai Creta`, or the vehicle type when no make was recorded. */
function makeAndModel(jobCard: DashboardNewJobCard): string {
  const { brand, model, vehicleType } = jobCard.vehicle
  return [brand, model].filter(Boolean).join(' ') || vehicleType
}

/** The bill, what is in against it, and a bar that fills as it is paid. */
function Money({ jobCard, align = 'left' }: { jobCard: DashboardNewJobCard; align?: 'left' | 'right' }) {
  const percent = paidPercent(jobCard.paidAmount, jobCard.totalAmount)

  return (
    <div className={cn('min-w-[8.5rem]', align === 'right' && 'text-right')}>
      <div className={cn('flex items-center gap-2', align === 'right' && 'justify-end')}>
        <span className="text-sm font-semibold text-slate-900">
          {formatCurrency(jobCard.totalAmount)}
        </span>
        <Badge tone={paymentStatusTone(jobCard.paymentStatus)}>
          {paymentStatusLabel(jobCard.paymentStatus)}
        </Badge>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full', paidBarClass(jobCard.paymentStatus))}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {jobCard.balance > 0 ? (
          <>
            Due <span className="font-semibold text-red-600">{formatCurrency(jobCard.balance)}</span>
          </>
        ) : (
          <span className="font-medium text-emerald-600">Fully paid</span>
        )}
      </p>
    </div>
  )
}

/** The job number set as a tag, the way it is printed on the card itself. */
function JobNumber({ jobCard }: { jobCard: DashboardNewJobCard }) {
  return (
    <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-violet-700 ring-1 ring-inset ring-violet-200">
      {jobCard.jobNumber}
    </span>
  )
}

/** Which job cards the panel lists — one per tile that opens it. */
export type JobCardsPanelVariant = 'new' | 'unpaid' | 'partial'

interface VariantConfig {
  fetchPage: (page: number, limit: number) => Promise<DashboardJobCardsPage>
  tone: ListPanelTone
  icon: LucideIcon
  title: string
  subtitle: (data: DashboardJobCardsPage | null) => string
  failure: string
  empty: ComponentProps<typeof ListPanel>['empty']
}

const VARIANTS: Record<JobCardsPanelVariant, VariantConfig> = {
  new: {
    fetchPage: getDashboardNewJobCards,
    tone: 'violet',
    icon: FilePlus2,
    title: 'New Job Cards',
    subtitle: (data) => `Opened in ${monthLabel(data?.month)} · from the 1st to today`,
    failure: 'Could not load new job cards.',
    empty: {
      title: 'No job cards opened this month yet',
      description: 'Job cards you open from the 1st of the month will show up here.',
      action: { to: '/app/job-cards/new', label: 'New job card' },
    },
  },
  unpaid: {
    fetchPage: getDashboardUnpaidBills,
    tone: 'danger',
    icon: AlertCircle,
    title: 'Unpaid Bills',
    subtitle: () => 'Nothing collected yet · oldest bill first',
    failure: 'Could not load unpaid bills.',
    empty: {
      title: 'No unpaid bills',
      description: 'Every job card has had at least some payment collected.',
    },
  },
  partial: {
    fetchPage: getDashboardPartiallyPaidBills,
    tone: 'warning',
    icon: ClipboardList,
    title: 'Partially Paid',
    subtitle: () => 'Part of the bill still owing · oldest bill first',
    failure: 'Could not load partially paid bills.',
    empty: {
      title: 'No part-paid bills',
      description: 'No job card has a balance left after a part payment.',
    },
  },
}

/**
 * A page of job cards with vehicle, owner and money, under the tile that
 * opened it: the ones opened this month, the unpaid ones, or the part-paid
 * ones. Each row opens the card's own screen.
 *
 * The parent keys it by variant, so switching tiles starts again on page 1.
 */
export function JobCardsPanel({ variant }: { variant: JobCardsPanelVariant }) {
  const config = VARIANTS[variant]
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PANEL_PAGE_SIZE)

  const { data, loading, error, reload } = useDashboardPage(
    config.fetchPage,
    page,
    limit,
    config.failure,
  )
  const jobCards = data?.jobCards ?? []

  const cardPath = (jobCard: DashboardNewJobCard) => `/app/job-cards/${jobCard.id}`

  return (
    <ListPanel
      tone={config.tone}
      icon={config.icon}
      title={config.title}
      subtitle={config.subtitle(data)}
      viewAll={{ to: '/app/job-cards', label: 'All job cards' }}
      empty={config.empty}
      loading={loading}
      error={error}
      onRetry={reload}
      pagination={data?.pagination ?? null}
      count={jobCards.length}
      onPageChange={setPage}
      onLimitChange={(next) => {
        setLimit(next)
        setPage(1)
      }}
    >
      {/* Table, from tablet width up */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-2.5">Job Card</th>
            <th className="px-3 py-2.5">Vehicle &amp; Owner</th>
            <th className="hidden px-3 py-2.5 lg:table-cell">Mechanic</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Amount</th>
            <th className="w-10 px-3 py-2.5" aria-label="Open" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobCards.map((jobCard) => (
            <tr
              key={jobCard.id}
              onClick={() => openInNewTab(cardPath(jobCard))}
              className={cn('group cursor-pointer transition-colors', panelRowHover(config.tone))}
            >
              <td className="px-5 py-3">
                <div className="space-y-1">
                  <JobNumber jobCard={jobCard} />
                  <p className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-500">
                    <CalendarDays className="h-3 w-3" /> {formatServiceDate(jobCard.serviceDate)}
                  </p>
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={jobCard.vehicle.customer.fullName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-700">
                      {jobCard.vehicle.vehicleNumber}
                      <span className="ml-1.5 font-normal text-slate-500">
                        {makeAndModel(jobCard)}
                      </span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {jobCard.vehicle.customer.fullName} · {jobCard.vehicle.customer.mobileNumber}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                {jobCard.assignedStaff ? (
                  <p className="flex items-center gap-1.5 text-sm text-slate-700">
                    <HardHat className="h-3.5 w-3.5 text-slate-400" />
                    {jobCard.assignedStaff.name}
                  </p>
                ) : (
                  <p className="text-xs italic text-slate-400">Not assigned</p>
                )}
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <ListChecks className="h-3 w-3" />
                  {jobCard.itemCount} item{jobCard.itemCount === 1 ? '' : 's'}
                </p>
              </td>
              <td className="px-3 py-3">
                <Badge tone={jobCardStatusTone(jobCard.status)}>
                  {jobCardStatusLabel(jobCard.status)}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <Money jobCard={jobCard} />
              </td>
              <td className="px-3 py-3">
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stacked rows on a phone */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {jobCards.map((jobCard) => (
          <li key={jobCard.id}>
            <Link
              {...NEW_TAB}
              to={cardPath(jobCard)}
              className="block px-4 py-3.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <JobNumber jobCard={jobCard} />
                    <Badge tone={jobCardStatusTone(jobCard.status)}>
                      {jobCardStatusLabel(jobCard.status)}
                    </Badge>
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {jobCard.vehicle.vehicleNumber}
                    <span className="ml-1.5 font-normal text-slate-500">{makeAndModel(jobCard)}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {jobCard.vehicle.customer.fullName} · {formatServiceDate(jobCard.serviceDate)}
                  </p>
                </div>
                <Money jobCard={jobCard} align="right" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ListPanel>
  )
}
