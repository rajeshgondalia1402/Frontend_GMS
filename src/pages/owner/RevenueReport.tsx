import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Car,
  Download,
  FileText,
  IndianRupee,
  Printer,
  Receipt,
  RefreshCw,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PaginationBar, SearchInput } from '@/components/common'
import { Badge, EmptyState, Input, Select, Skeleton, useToast } from '@/components/ui'
import { openInNewTab } from '@/components/dashboard/ListPanel'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getRevenueReport } from '@/services/dashboardService'
import { ApiError } from '@/services/httpClient'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import {
  PAYMENT_METHOD_OPTIONS,
  formatPaymentDate,
  paymentMethodIcon,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/payment'
import { formatServiceDate } from '@/lib/jobCard'
import { cn, formatCurrency, formatDayMonthYear } from '@/lib/utils'
import type {
  RevenueReport as RevenueReportData,
  RevenueReportKind,
  RevenueReportPayment,
  RevenueReportTrendPoint,
} from '@/types/dashboard'
import type { PaymentMethod } from '@/types/payment'

const PAGE_SIZE = 10
const PAGE_SIZES = [10, 25, 50, 100]

/** The bar colour of each method in the split, so the shares read apart. */
const METHOD_BARS = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']

const METHOD_FILTERS = [
  { label: 'All payment methods', value: '' },
  ...PAYMENT_METHOD_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
]

/** What each report is called, and what it says it is counted over. */
const REPORTS: Record<RevenueReportKind, { title: string; description: string }> = {
  total: {
    title: 'Total Revenue',
    description: 'Every payment collected, month by month',
  },
  month: {
    title: 'Revenue This Month',
    description: 'Payments collected from the 1st to now, day by day',
  },
}

/** The rows of the Excel download — one per receipt. */
const EXPORT_COLUMNS: ExportColumn<RevenueReportPayment>[] = [
  { header: 'Payment Date', value: (row) => formatPaymentDate(row.paymentDate) },
  { header: 'Job No.', value: (row) => row.serviceJob.jobNumber },
  { header: 'Customer', value: (row) => row.serviceJob.vehicle.customer.fullName },
  { header: 'Mobile', value: (row) => row.serviceJob.vehicle.customer.mobileNumber },
  { header: 'Vehicle No.', value: (row) => row.serviceJob.vehicle.vehicleNumber },
  { header: 'Vehicle', value: (row) => vehicleName(row) },
  { header: 'Method', value: (row) => paymentMethodLabel(row.paymentMethod) },
  { header: 'Received By', value: (row) => row.receivedBy },
  { header: 'Amount (₹)', value: (row) => row.amount },
  { header: 'Bill Amount (₹)', value: (row) => row.serviceJob.totalAmount },
  { header: 'Bill Status', value: (row) => paymentStatusLabel(row.serviceJob.paymentStatus) },
  { header: 'Note', value: (row) => row.note ?? '', wrap: true },
]

function vehicleName(row: RevenueReportPayment): string {
  const { brand, model } = row.serviceJob.vehicle
  return [brand, model].filter(Boolean).join(' ')
}

/** `05-Oct-2026` from a `YYYY-MM-DD` day, read on the local calendar. */
function formatDay(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return formatDayMonthYear(new Date(year, month - 1, day))
}

/** The line under the title: the window the figures were counted over. */
function periodLabel(kind: RevenueReportKind, data: RevenueReportData | null, from: string, to: string) {
  if (kind === 'month') {
    const start = data?.period.startDate
    return start
      ? `${formatServiceDate(start)} to ${formatServiceDate(data.period.endDate)}`
      : REPORTS.month.description
  }

  if (from && to) return `${formatDay(from)} to ${formatDay(to)}`
  if (from) return `From ${formatDay(from)} to today`
  if (to) return `All payments up to ${formatDay(to)}`
  return data?.firstPaymentDate
    ? `All time — since ${formatServiceDate(data.firstPaymentDate)}`
    : 'All time'
}

/** One figure above the report. */
function ReportTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  loading,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  accent: string
  loading: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-500 sm:text-[11px]">
          {label}
        </p>
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9',
            accent,
          )}
        >
          <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24 rounded-md" />
      ) : (
        <p className="mt-1 truncate text-lg font-bold tabular-nums text-slate-900 sm:text-xl xl:text-2xl">
          {value}
        </p>
      )}
      <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{hint}</p>
    </div>
  )
}

/** How the money came in, by payment method — a stacked bar and a row each. */
function MethodSplit({ data }: { data: RevenueReportData }) {
  const { total } = data.summary

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">By payment method</h2>

      {data.byMethod.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nothing collected.</p>
      ) : (
        <>
          <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {data.byMethod.map((row, index) => (
              <div
                key={row.paymentMethod}
                className={METHOD_BARS[index % METHOD_BARS.length]}
                style={{ width: `${total > 0 ? (row.total / total) * 100 : 0}%` }}
              />
            ))}
          </div>
          <ul className="space-y-2">
            {data.byMethod.map((row, index) => {
              const Icon = paymentMethodIcon(row.paymentMethod)
              const share = total > 0 ? Math.round((row.total / total) * 100) : 0
              return (
                <li
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
                    <span className="shrink-0 text-xs text-slate-400">× {row.count}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(row.total)}
                    </span>
                    <span className="block text-[11px] text-slate-400">{share}%</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

const PLOT_HEIGHT = 160

/**
 * The total per month (all time) or per day (this month). Every bucket is
 * drawn, the empty ones too, so a quiet stretch reads as one; a long run of
 * months scrolls sideways rather than squeezing the bars to slivers.
 */
function TrendChart({ points, unit }: { points: RevenueReportTrendPoint[]; unit: 'month' | 'day' }) {
  const max = Math.max(...points.map((point) => point.total), 1)
  const best = points.reduce<RevenueReportTrendPoint | null>(
    (top, point) => (point.total > 0 && (!top || point.total > top.total) ? point : top),
    null,
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">
          {unit === 'month' ? 'Month by month' : 'Day by day'}
        </h2>
        {best && (
          <span className="text-xs text-slate-500">
            Best {unit}: <span className="font-semibold text-slate-700">{best.label}</span> ·{' '}
            {formatCurrency(best.total)}
          </span>
        )}
      </div>

      {points.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nothing collected.</p>
      ) : (
        <div className="scrollbar-thin overflow-x-auto pb-1">
          <div
            className="flex items-end gap-1.5"
            style={{ minWidth: points.length * (unit === 'month' ? 48 : 26) }}
          >
            {points.map((point) => (
              <div
                key={point.key}
                className="group flex min-w-0 flex-1 flex-col items-center"
                title={`${point.label}: ${formatCurrency(point.total)} (${point.count} payment${
                  point.count === 1 ? '' : 's'
                })`}
              >
                <div className="flex w-full items-end justify-center" style={{ height: PLOT_HEIGHT }}>
                  <div
                    className={cn(
                      'w-full max-w-[2.5rem] rounded-t-md transition-colors',
                      point.total > 0
                        ? 'bg-emerald-500 group-hover:bg-emerald-600'
                        : 'bg-slate-100',
                    )}
                    style={{ height: Math.max((point.total / max) * PLOT_HEIGHT, 4) }}
                  />
                </div>
                <span className="mt-1.5 w-full truncate text-center text-[10px] font-medium text-slate-400">
                  {unit === 'day' ? point.label.slice(0, 2) : point.label.replace(' 20', " '")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** The receipts: a table from `lg` up, stacked cards below it. */
function PaymentList({ rows }: { rows: RevenueReportPayment[] }) {
  const open = (row: RevenueReportPayment) => openInNewTab(`/app/job-cards/${row.serviceJob.id}`)

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:block print:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Job No.</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Bill</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const { serviceJob } = row
              const Icon = paymentMethodIcon(row.paymentMethod)
              return (
                <tr
                  key={row.id}
                  onClick={() => open(row)}
                  className="cursor-pointer transition-colors hover:bg-emerald-50/40"
                  title="Open the job card in a new tab"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatPaymentDate(row.paymentDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                      {serviceJob.jobNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{serviceJob.vehicle.customer.fullName}</p>
                    <p className="text-xs text-slate-500">{serviceJob.vehicle.customer.mobileNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-900">{serviceJob.vehicle.vehicleNumber}</p>
                    <p className="text-xs text-slate-500">{vehicleName(row) || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      {paymentMethodLabel(row.paymentMethod)}
                    </span>
                    <p className="text-xs text-slate-400">by {row.receivedBy}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={paymentStatusTone(serviceJob.paymentStatus)}>
                      {paymentStatusLabel(serviceJob.paymentStatus)}
                    </Badge>
                    <p className="mt-0.5 text-xs tabular-nums text-slate-400">
                      of {formatCurrency(serviceJob.totalAmount)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                    {formatCurrency(row.amount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden print:hidden">
        {rows.map((row) => {
          const { serviceJob } = row
          const Icon = paymentMethodIcon(row.paymentMethod)
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => open(row)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition-colors hover:border-emerald-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                      {serviceJob.jobNumber}
                    </span>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatPaymentDate(row.paymentDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-bold tabular-nums text-emerald-700">
                    {formatCurrency(row.amount)}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p className="flex min-w-0 items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{serviceJob.vehicle.customer.fullName}</span>
                    <span className="shrink-0 text-slate-400">
                      · {serviceJob.vehicle.customer.mobileNumber}
                    </span>
                  </p>
                  <p className="flex min-w-0 items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="shrink-0 font-mono text-xs">{serviceJob.vehicle.vehicleNumber}</span>
                    <span className="truncate text-slate-400">{vehicleName(row)}</span>
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {paymentMethodLabel(row.paymentMethod)} · by {row.receivedBy}
                  </span>
                  <Badge tone={paymentStatusTone(serviceJob.paymentStatus)}>
                    {paymentStatusLabel(serviceJob.paymentStatus)}
                  </Badge>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/**
 * A revenue report — what the two revenue tiles on the dashboard open in a new
 * window, and what the Reports menu lists.
 *
 * Everything is counted by the API, over the same window as the tile, so the
 * total with no filters is the tile's own number. The filters narrow the
 * figures and the receipts together: a report of UPI payments totals UPI.
 */
export function RevenueReport({ kind }: { kind: RevenueReportKind }) {
  const { toast } = useToast()
  const { title } = REPORTS[kind]

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [attempt, setAttempt] = useState(0)

  const [data, setData] = useState<RevenueReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // A range that ends before it starts is not sent: the API would only refuse it.
  const rangeError = fromDate && toDate && fromDate > toDate ? 'To date is before the from date.' : ''

  // Narrowing the report makes page 4 of the old result meaningless.
  const filterKey = `${debouncedSearch}|${method}|${fromDate}|${toDate}|${limit}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  useEffect(() => {
    document.title = `${title} · Reports`
  }, [title])

  useEffect(() => {
    if (rangeError) return
    let cancelled = false
    setLoading(true)
    setError(null)

    getRevenueReport(kind, {
      page,
      limit,
      paymentMethod: method,
      search: debouncedSearch,
      fromDate,
      toDate,
    })
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load this report.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [kind, page, limit, method, debouncedSearch, fromDate, toDate, rangeError, attempt])

  const narrowed = Boolean(debouncedSearch.trim() || method || fromDate || toDate)
  const clearFilters = () => {
    setSearch('')
    setMethod('')
    setFromDate('')
    setToDate('')
  }

  /**
   * Downloads every receipt the filters match, not just the page on screen —
   * the report is asked for once more with a page big enough to hold them all.
   */
  const exportExcel = async () => {
    if (!data || data.pagination.total === 0) return
    setExporting(true)
    try {
      const all = await getRevenueReport(kind, {
        page: 1,
        limit: data.pagination.total,
        paymentMethod: method,
        search: debouncedSearch,
        fromDate,
        toDate,
      })

      downloadExcel(
        datedFileName(kind === 'total' ? 'total-revenue' : 'revenue-this-month'),
        {
          title: `${title} Report`,
          subtitle: periodLabel(kind, all, fromDate, toDate),
          sheetName: title,
          includeIndex: true,
          meta: [
            { label: 'Total Collected', value: formatCurrency(all.summary.total) },
            { label: 'Payment Method', value: method ? paymentMethodLabel(method) : 'All' },
            { label: 'Search', value: debouncedSearch.trim() || 'None' },
            ...all.byMethod.map((row) => ({
              label: paymentMethodLabel(row.paymentMethod),
              value: `${formatCurrency(row.total)} (${row.count})`,
            })),
          ],
        },
        EXPORT_COLUMNS,
        all.payments,
      )
    } catch (cause) {
      toast(cause instanceof ApiError ? cause.message : 'Could not download the report.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const firstLoad = loading && !data
  const summary = data?.summary
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

  const headerButton =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50'

  return (
    <div className="space-y-5">
      {/* Title, the window it covers, and what can be done with it. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            {kind === 'total' ? <Wallet className="h-5 w-5" /> : <IndianRupee className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
            <p className="truncate text-sm text-slate-500">
              {periodLabel(kind, data, fromDate, toDate)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            disabled={loading}
            className={cn(headerButton, 'flex-1 sm:flex-none')}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={exporting || !data || data.pagination.total === 0}
            className={cn(headerButton, 'flex-1 sm:flex-none')}
          >
            <Download className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Excel'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!data}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50 sm:flex-none"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Filters. The dates belong to the all-time report only: this month's
          window is the tile's, and moving it would make it another report. */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card print:hidden sm:p-4">
        <div
          className={cn(
            'grid grid-cols-1 gap-3',
            kind === 'total' ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2',
          )}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Job no., customer, mobile or vehicle..."
          />
          <Select
            aria-label="Payment method"
            options={METHOD_FILTERS}
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod | '')}
          />
          {kind === 'total' && (
            <>
              <Input
                type="date"
                aria-label="From date"
                title="From date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
              />
              <Input
                type="date"
                aria-label="To date"
                title="To date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                error={rangeError || undefined}
              />
            </>
          )}
        </div>
        {narrowed && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              The figures below count only the payments these filters match.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          </div>
        )}
      </div>

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
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <ReportTile
              icon={IndianRupee}
              label="Total Collected"
              value={summary ? formatCurrency(summary.total) : '—'}
              hint={summary ? `From ${plural(summary.customers, 'customer')}` : 'Collected, not billed'}
              accent="bg-emerald-50 text-emerald-600"
              loading={firstLoad}
            />
            <ReportTile
              icon={Receipt}
              label="Payments"
              value={summary ? summary.count.toLocaleString('en-IN') : '—'}
              hint={summary ? `Against ${plural(summary.jobCards, 'job card')}` : 'Receipts taken'}
              accent="bg-primary-50 text-primary-600"
              loading={firstLoad}
            />
            <ReportTile
              icon={TrendingUp}
              label="Average Payment"
              value={summary ? formatCurrency(summary.average) : '—'}
              hint="Per receipt"
              accent="bg-sky-50 text-sky-600"
              loading={firstLoad}
            />
            <ReportTile
              icon={FileText}
              label="Largest Payment"
              value={summary ? formatCurrency(summary.highest) : '—'}
              hint="Single receipt"
              accent="bg-violet-50 text-violet-600"
              loading={firstLoad}
            />
          </div>

          {firstLoad || !data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <Skeleton className="h-56 rounded-xl lg:col-span-2" />
                <Skeleton className="h-56 rounded-xl lg:col-span-3" />
              </div>
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className={cn('space-y-4 transition-opacity', loading && 'opacity-60')}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 print:grid-cols-5">
                <div className="lg:col-span-2 print:col-span-2">
                  <MethodSplit data={data} />
                </div>
                <div className="min-w-0 lg:col-span-3 print:col-span-3">
                  <TrendChart points={data.trend} unit={data.trendUnit} />
                </div>
              </div>

              <section>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-slate-700">Payments</h2>
                  <span className="text-xs text-slate-400">
                    Newest first · click one to open its job card
                  </span>
                </div>

                {data.pagination.total === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title={narrowed ? 'No payments match' : 'No payments yet'}
                    description={
                      narrowed
                        ? 'Try a different search, or clear the filters.'
                        : kind === 'month'
                          ? 'Nothing has been collected this month so far.'
                          : 'Payments taken against job cards will show up here.'
                    }
                  />
                ) : (
                  <>
                    <PaymentList rows={data.payments} />
                    <div className="print:hidden">
                      <PaginationBar
                        pagination={data.pagination}
                        count={data.payments.length}
                        pageSizes={PAGE_SIZES}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function TotalRevenueReport() {
  return <RevenueReport kind="total" />
}

export function MonthRevenueReport() {
  return <RevenueReport kind="month" />
}
