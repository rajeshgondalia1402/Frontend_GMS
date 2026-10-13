import { useEffect, useState } from 'react'
import { AlertCircle, ChevronRight, IndianRupee, Receipt, RefreshCw } from 'lucide-react'
import { PaginationBar } from '@/components/common'
import { Modal, Skeleton } from '@/components/ui'
import { getDashboardRevenueMonth } from '@/services/dashboardService'
import { ApiError } from '@/services/httpClient'
import { formatPaymentDate, paymentMethodIcon, paymentMethodLabel } from '@/lib/payment'
import { cn, formatCurrency } from '@/lib/utils'
import type { DashboardRevenueMonth } from '@/types/dashboard'
import { openInNewTab } from './ListPanel'

const PAGE_SIZE = 10
const PAGE_SIZES = [10, 25, 50]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** The bar colour of each method in the split, so the shares read apart. */
const METHOD_BARS = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']

interface RevenueMonthModalProps {
  /** The bar that was clicked; `null` keeps the popup closed. */
  selection: { year: number; month: number } | null
  onClose: () => void
}

/**
 * One bar of the revenue chart, opened up: the month's total — the bar's own
 * height, from the same server window — how it came in by payment method, and
 * the receipts behind it, a page at a time. A receipt opens its job card in a
 * new tab, so the dashboard stays where it was.
 */
export function RevenueMonthModal({ selection, onClose }: RevenueMonthModalProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [data, setData] = useState<DashboardRevenueMonth | null>(null)
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

    getDashboardRevenueMonth(year, month, page, limit)
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

  const title = month && year ? `Revenue · ${MONTH_NAMES[month - 1]} ${year}` : 'Revenue'
  const firstLoad = loading && !data

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
      ) : firstLoad || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* The month's total — the height of the bar that was clicked. */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <IndianRupee className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-emerald-700">Total collected</p>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(data.total)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">{data.count}</p>
              <p className="text-xs text-slate-500">receipt{data.count === 1 ? '' : 's'}</p>
            </div>
          </div>

          {data.count === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Receipt className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-slate-900">No payments this month</p>
              <p className="mt-1 text-sm text-slate-500">
                Nothing was collected in {MONTH_NAMES[data.month - 1]} {data.year}.
              </p>
            </div>
          ) : (
            <>
              {/* How it came in, by payment method. */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  By payment method
                </h3>
                <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  {data.byMethod.map((row, index) => (
                    <div
                      key={row.paymentMethod}
                      className={METHOD_BARS[index % METHOD_BARS.length]}
                      style={{ width: `${data.total > 0 ? (row.total / data.total) * 100 : 0}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {data.byMethod.map((row, index) => {
                    const Icon = paymentMethodIcon(row.paymentMethod)
                    return (
                      <div
                        key={row.paymentMethod}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                          <span
                            className={cn(
                              'h-2.5 w-2.5 shrink-0 rounded-full',
                              METHOD_BARS[index % METHOD_BARS.length],
                            )}
                          />
                          <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{paymentMethodLabel(row.paymentMethod)}</span>
                          <span className="text-xs text-slate-400">× {row.count}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatCurrency(row.total)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* The receipts behind it. */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payments
                </h3>
                <ul
                  className={cn(
                    'divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 transition-opacity',
                    loading && 'pointer-events-none opacity-60',
                  )}
                >
                  {data.payments.map((payment) => {
                    const { serviceJob } = payment
                    const Icon = paymentMethodIcon(payment.paymentMethod)
                    return (
                      <li key={payment.id}>
                        <button
                          type="button"
                          onClick={() => openInNewTab(`/app/job-cards/${serviceJob.id}`)}
                          className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-emerald-50/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                                {serviceJob.jobNumber}
                              </span>
                              <span className="truncate text-sm font-medium text-slate-800">
                                {serviceJob.vehicle.customer.fullName}
                              </span>
                              <span className="text-xs text-slate-500">
                                {serviceJob.vehicle.vehicleNumber}
                              </span>
                            </div>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                              <span>{formatPaymentDate(payment.paymentDate)}</span>
                              <span className="inline-flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {paymentMethodLabel(payment.paymentMethod)}
                              </span>
                              <span>· by {payment.receivedBy}</span>
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-emerald-700">
                            {formatCurrency(payment.amount)}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-500" />
                        </button>
                      </li>
                    )
                  })}
                </ul>

                {data.pagination.total > PAGE_SIZES[0] && (
                  <PaginationBar
                    pagination={data.pagination}
                    count={data.payments.length}
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
