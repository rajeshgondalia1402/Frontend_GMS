import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock, CreditCard, Download, MapPin, Phone } from 'lucide-react'
import {
  DEFAULT_PAGE_SIZE,
  FilterCard,
  PageHeader,
  PaginationBar,
  ResponsiveList,
  SearchInput,
  SortBar,
} from '@/components/common'
import type { Column, SortBarField, SortOrder } from '@/components/common'
import { Badge, Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  daysLeftClass,
  daysLeftLabel,
  planLabel,
  planPriceLabel,
  planTone,
} from '@/lib/adminReport'
import { formatCount } from '@/lib/dashboard'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import { cn, formatDate } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import type { Pagination } from '@/types/auth'
import type {
  ActiveGaragesReport,
  ActiveGaragesSortBy,
  GarageReportRow,
  ActivePlanFilter,
} from '@/types/admin'

/** Every `?plan=` the page understands; '' is all active garages. */
const PLAN_FILTERS: { value: '' | ActivePlanFilter; label: string }[] = [
  { value: '', label: 'All active' },
  { value: 'PAID', label: 'Paid (monthly + yearly)' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'FREE_TRIAL', label: 'Free Trial' },
]

/** The filters that sit under the Paid card. */
const PAID_FILTERS: ActivePlanFilter[] = ['PAID', 'MONTHLY', 'YEARLY']

type Counts = ActiveGaragesReport['counts']

/** The Paid card's sub-filter: all paid, or one paid plan. Each shows its count. */
const PAID_TABS: { value: ActivePlanFilter; label: string; count: (c: Counts) => number }[] = [
  { value: 'PAID', label: 'All paid', count: (c) => c.paidGarages },
  { value: 'MONTHLY', label: 'Monthly', count: (c) => c.monthlyGarages },
  { value: 'YEARLY', label: 'Yearly', count: (c) => c.yearlyGarages },
]

interface SortState {
  field: ActiveGaragesSortBy
  order: SortOrder
}

/** Newest registration first — the API's own default. */
const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

const SORT_FIELDS: SortBarField[] = [
  { key: 'garageName', label: 'Garage' },
  { key: 'ownerName', label: 'Owner' },
  { key: 'city', label: 'City' },
  { key: 'createdAt', label: 'Registered' },
]

const EXPORT_COLUMNS: ExportColumn<GarageReportRow>[] = [
  { header: 'Garage Name', value: ({ garage }) => garage.garageName, width: 24 },
  { header: 'Owner Name', value: ({ garage }) => garage.ownerName, width: 22 },
  { header: 'Mobile Number', value: ({ garage }) => garage.mobileNumber, align: 'left', width: 16 },
  { header: 'Email', value: ({ garage }) => garage.email, width: 26 },
  { header: 'City', value: ({ garage }) => garage.city, width: 16 },
  { header: 'Plan', value: ({ subscription }) => planLabel(subscription.plan), width: 14 },
  { header: 'Plan Price', value: ({ subscription }) => Number(subscription.price) || 0, align: 'right', width: 12 },
  {
    header: 'Start Date',
    value: ({ subscription }) => formatDate(subscription.startDate),
    align: 'center',
    width: 14,
  },
  {
    header: 'End Date',
    value: ({ subscription }) => formatDate(subscription.endDate),
    align: 'center',
    width: 14,
  },
  { header: 'Days Left', value: ({ subscription }) => subscription.pendingDays, align: 'right', width: 11 },
  {
    header: 'Registered On',
    value: ({ garage }) => formatDate(garage.registeredAt),
    align: 'center',
    width: 15,
  },
]

/**
 * Reports — the Active Garages report: every garage live on a subscription
 * right now, the list behind the dashboard's Active tile. `?plan=` opens it
 * already on one plan.
 */
export function AdminReports() {
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 350)
  const [plan, setPlan] = useState<'' | ActivePlanFilter>(() => {
    const value = searchParams.get('plan')?.toUpperCase() ?? ''
    const known = PLAN_FILTERS.find((filter) => filter.value === value)
    return known ? known.value : ''
  })
  const onPaid = plan !== '' && PAID_FILTERS.includes(plan)

  const [report, setReport] = useState<ActiveGaragesReport | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only the newest request may write to state.
  const latestRequest = useRef(0)

  // A new search, plan, size or order starts from page one.
  const queryKey = `${search}|${plan}|${limit}|${sort.field}:${sort.order}`
  const [lastQueryKey, setLastQueryKey] = useState(queryKey)
  if (lastQueryKey !== queryKey) {
    setLastQueryKey(queryKey)
    setPage(1)
  }

  const fetchPage = useCallback(async () => {
    const requestId = ++latestRequest.current
    setLoading(true)
    setError(null)

    try {
      const data = await adminService.listActiveGarages({
        page,
        limit,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
        ...(plan ? { plan } : {}),
      })
      if (requestId !== latestRequest.current) return
      setReport(data)
    } catch (err) {
      if (requestId !== latestRequest.current) return
      setError(err instanceof ApiError ? err.message : 'Could not load active garages.')
      setReport(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, plan, page, limit, sort])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  const handleSort = (sortKey: string) =>
    setSort((current) =>
      current.field === sortKey
        ? { ...current, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field: sortKey as ActiveGaragesSortBy, order: 'asc' },
    )

  const rows = report?.garages ?? []
  const pagination: Pagination | null = report?.pagination ?? null
  const counts = report?.counts
  const narrowed = Boolean(search) || Boolean(plan)

  const exportExcel = () =>
    downloadExcel(
      datedFileName('active-garages'),
      {
        title: 'Active Garages',
        subtitle: 'GaragePro Admin — garages live on a subscription right now',
        sheetName: 'Active Garages',
        includeIndex: true,
        meta: [
          { label: 'Search', value: search || 'All garages' },
          { label: 'Plan', value: PLAN_FILTERS.find((filter) => filter.value === plan)?.label ?? 'All active' },
        ],
      },
      EXPORT_COLUMNS,
      rows,
    )

  const columns: Column<GarageReportRow>[] = [
    {
      header: 'Garage',
      sortKey: 'garageName',
      className: 'min-w-[9rem]',
      accessor: ({ garage }) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{garage.garageName}</p>
          <p className="text-xs text-slate-500">{garage.city || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Owner',
      sortKey: 'ownerName',
      className: 'min-w-[8.5rem]',
      accessor: ({ garage }) => (
        <div className="min-w-0">
          <p className="text-slate-800">{garage.ownerName}</p>
          <p className="whitespace-nowrap text-xs text-slate-500">{garage.mobileNumber}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: ({ subscription }) => (
        <div className="flex flex-col items-start gap-0.5">
          <Badge tone={planTone(subscription.plan)}>{planLabel(subscription.plan)}</Badge>
          <span className="text-xs text-slate-500">{planPriceLabel(subscription.price)}</span>
        </div>
      ),
    },
    {
      header: 'Start',
      className: 'hidden whitespace-nowrap xl:table-cell',
      accessor: ({ subscription }) => formatDate(subscription.startDate),
    },
    {
      header: 'Ends',
      className: 'hidden whitespace-nowrap lg:table-cell',
      accessor: ({ subscription }) => formatDate(subscription.endDate),
    },
    {
      header: 'Days left',
      className: 'whitespace-nowrap',
      accessor: ({ subscription }) => (
        <span className={`font-medium ${daysLeftClass(subscription)}`}>
          {daysLeftLabel(subscription)}
        </span>
      ),
    },
    {
      header: 'Registered',
      sortKey: 'createdAt',
      className: 'hidden whitespace-nowrap xl:table-cell',
      accessor: ({ garage }) => formatDate(garage.registeredAt),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Active Garages Report"
        subtitle="Every garage live on a subscription right now"
      />

      {/* The counts are the filters: tap one and the list narrows to it. */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterCard
          icon={CheckCircle2}
          label="All active garages"
          value={counts ? formatCount(counts.activeGarages) : '—'}
          tone="success"
          selected={plan === ''}
          onClick={() => setPlan('')}
        />
        <FilterCard
          icon={CreditCard}
          label="On a paid plan"
          value={counts ? formatCount(counts.paidGarages) : '—'}
          tone="violet"
          selected={onPaid}
          onClick={() => setPlan('PAID')}
        />
        <FilterCard
          icon={Clock}
          label="On the free trial"
          value={counts ? formatCount(counts.freeTrial) : '—'}
          tone="info"
          selected={plan === 'FREE_TRIAL'}
          onClick={() => setPlan('FREE_TRIAL')}
        />
      </div>

      {/* Paid splits into its two plans; shown only while a paid filter is on. */}
      {onPaid && (
        <div
          role="group"
          aria-label="Paid plan"
          className="mb-3 inline-flex w-full rounded-xl border border-violet-200 bg-violet-50/60 p-1 sm:w-auto"
        >
          {PAID_TABS.map((tab) => {
            const active = plan === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={active}
                onClick={() => setPlan(tab.value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none',
                  active
                    ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-200'
                    : 'text-slate-600 hover:text-violet-700',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-xs font-semibold',
                    active ? 'bg-violet-100 text-violet-700' : 'bg-white/80 text-slate-500',
                  )}
                >
                  {counts ? formatCount(tab.count(counts)) : '—'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search owner, garage, city, email or mobile..."
          className="lg:flex-1"
        />
        <Button
          variant="outline"
          className="shrink-0"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={rows.length === 0}
          onClick={exportExcel}
        >
          Download Excel
        </Button>
      </div>


      <SortBar
        className="mb-4 lg:hidden"
        fields={SORT_FIELDS}
        sortBy={sort.field}
        sortOrder={sort.order}
        onSort={handleSort}
      />

      {loading && !report ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Could not load active garages"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No active garages found"
          description={
            narrowed ? 'Try a different search or plan.' : 'No garage is live on a subscription.'
          }
        />
      ) : (
        <>
          <ResponsiveList
            data={rows}
            columns={columns}
            keyField={(row) => row.garage.id}
            sortBy={sort.field}
            sortOrder={sort.order}
            onSort={handleSort}
            renderCard={({ garage, subscription }) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{garage.garageName}</p>
                    <p className="truncate text-sm text-slate-500">{garage.ownerName}</p>
                  </div>
                  <Badge tone={planTone(subscription.plan)} className="shrink-0 whitespace-nowrap">
                    {planLabel(subscription.plan)}
                  </Badge>
                </div>

                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p className="flex min-w-0 items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{garage.mobileNumber}</span>
                  </p>
                  {garage.city && (
                    <p className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{garage.city}</span>
                    </p>
                  )}
                  <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{formatDate(subscription.startDate)}</span>
                    <span aria-hidden="true">→</span>
                    <span className="whitespace-nowrap">{formatDate(subscription.endDate)}</span>
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
                  <span className="text-sm text-slate-500">{planPriceLabel(subscription.price)}</span>
                  <span className={`whitespace-nowrap text-sm font-semibold ${daysLeftClass(subscription)}`}>
                    {daysLeftLabel(subscription)}
                  </span>
                </div>
              </div>
            )}
          />

          {pagination && (
            <PaginationBar
              pagination={pagination}
              count={rows.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}
    </div>
  )
}
