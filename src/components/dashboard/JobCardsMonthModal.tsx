import { useEffect, useState } from 'react'
import { AlertCircle, CarFront, ChevronRight, FileText, HardHat, RefreshCw } from 'lucide-react'
import { PaginationBar } from '@/components/common'
import { Badge, Modal, Skeleton } from '@/components/ui'
import { getDashboardJobCardsMonth } from '@/services/dashboardService'
import { ApiError } from '@/services/httpClient'
import { formatServiceDate, jobCardStatusLabel, jobCardStatusTone } from '@/lib/jobCard'
import { paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import { cn, formatCurrency } from '@/lib/utils'
import type { DashboardJobCardsMonth } from '@/types/dashboard'
import { openInNewTab } from './ListPanel'

const PAGE_SIZE = 10
const PAGE_SIZES = [10, 25, 50]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** One count in the split under the headline, e.g. "Pending 2". */
function SplitChip({ label, count, dot }: { label: string; count: number; dot: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-slate-700">
        <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900">{count}</span>
    </div>
  )
}

interface JobCardsMonthModalProps {
  /** The bar that was clicked; `null` keeps the popup closed. */
  selection: { year: number; month: number } | null
  onClose: () => void
}

/**
 * One bar of the vehicle services chart, opened up: the job cards opened that
 * month — as many as the bar is tall, from the same server window — how many
 * are still pending or delivered and how many are paid, and the cards
 * themselves a page at a time. A card opens in a new tab, so the dashboard
 * stays where it was.
 */
export function JobCardsMonthModal({ selection, onClose }: JobCardsMonthModalProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [data, setData] = useState<DashboardJobCardsMonth | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const year = selection?.year
  const month = selection?.month

  // A different bar starts again on its own first page, with nothing of the
  // last month's left on screen.
  useEffect(() => {
    setPage(1)
    setData(null)
  }, [year, month])

  useEffect(() => {
    if (!year || !month) return
    let cancelled = false
    setLoading(true)
    setError(null)

    getDashboardJobCardsMonth(year, month, page, limit)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load this month.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year, month, page, limit, attempt])

  const title =
    month && year ? `Vehicle Services · ${MONTH_NAMES[month - 1]} ${year}` : 'Vehicle Services'

  return (
    <Modal open={selection !== null} onClose={onClose} title={title} size="xl">
      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : !data ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* The month's count — the height of the bar that was clicked. */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white">
                <CarFront className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-violet-700">Job cards opened</p>
                <p className="text-2xl font-bold tracking-tight text-slate-900">{data.count}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">
                {formatCurrency(data.totalBilled)}
              </p>
              <p className="text-xs text-slate-500">billed</p>
            </div>
          </div>

          {data.count === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileText className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-slate-900">No job cards this month</p>
              <p className="mt-1 text-sm text-slate-500">
                No job card was opened in {MONTH_NAMES[data.month - 1]} {data.year}.
              </p>
            </div>
          ) : (
            <>
              {/* Where the month's cards stand. */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    By status
                  </h3>
                  <div className="space-y-2">
                    <SplitChip label="Pending" count={data.byStatus.pending} dot="bg-amber-500" />
                    <SplitChip
                      label="Delivered"
                      count={data.byStatus.delivered}
                      dot="bg-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    By payment
                  </h3>
                  <div className="space-y-2">
                    <SplitChip label="Unpaid" count={data.byPaymentStatus.unpaid} dot="bg-red-500" />
                    <SplitChip
                      label="Partially paid"
                      count={data.byPaymentStatus.partiallyPaid}
                      dot="bg-amber-500"
                    />
                    <SplitChip label="Paid" count={data.byPaymentStatus.paid} dot="bg-emerald-500" />
                  </div>
                </div>
              </div>

              {/* The cards themselves. */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Job cards
                </h3>
                <ul
                  className={cn(
                    'divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 transition-opacity',
                    loading && 'pointer-events-none opacity-60',
                  )}
                >
                  {data.jobCards.map((jobCard) => {
                    const { vehicle } = jobCard
                    const makeModel = [vehicle.brand, vehicle.model].filter(Boolean).join(' ')
                    return (
                      <li key={jobCard.id}>
                        <button
                          type="button"
                          onClick={() => openInNewTab(`/app/job-cards/${jobCard.id}`)}
                          className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-violet-50/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                                {jobCard.jobNumber}
                              </span>
                              <span className="truncate text-sm font-medium text-slate-800">
                                {vehicle.customer.fullName}
                              </span>
                              <Badge tone={jobCardStatusTone(jobCard.status)}>
                                {jobCardStatusLabel(jobCard.status)}
                              </Badge>
                            </div>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                              <span>
                                {vehicle.vehicleNumber}
                                {makeModel && ` · ${makeModel}`}
                              </span>
                              <span>{formatServiceDate(jobCard.serviceDate)}</span>
                              {jobCard.assignedStaff && (
                                <span className="inline-flex items-center gap-1">
                                  <HardHat className="h-3 w-3" />
                                  {jobCard.assignedStaff.name}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(jobCard.totalAmount)}
                            </p>
                            <Badge tone={paymentStatusTone(jobCard.paymentStatus)}>
                              {paymentStatusLabel(jobCard.paymentStatus)}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-violet-500" />
                        </button>
                      </li>
                    )
                  })}
                </ul>

                {data.pagination.total > PAGE_SIZES[0] && (
                  <PaginationBar
                    pagination={data.pagination}
                    count={data.jobCards.length}
                    pageSizes={PAGE_SIZES}
                    onPageChange={setPage}
                    onLimitChange={(next) => {
                      setLimit(next)
                      setPage(1)
                    }}
                    disabled={loading}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
