import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlarmClock,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  MapPin,
  Phone,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  ActionButton,
  DEFAULT_PAGE_SIZE,
  FilterCard,
  PageHeader,
  PaginationBar,
  ResponsiveList,
  SearchInput,
  SortBar,
} from '@/components/common'
import type { Column, FilterCardTone, SortBarField, SortOrder } from '@/components/common'
import { Badge, Button, EmptyState, ErrorState, LoadingState, Select, WhatsappIcon } from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import {
  PLAN_FILTER_OPTIONS,
  STATE_FILTERS,
  STATUS_FILTER_OPTIONS,
  daysLeftClass,
  daysLeftLabel,
  planLabel,
  planPriceLabel,
  planTone,
  subscriptionBadge,
} from '@/lib/adminReport'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import { formatCount } from '@/lib/dashboard'
import { cn, formatDate } from '@/lib/utils'
import {
  SUBSCRIPTION_REMINDER_LABELS,
  openWhatsapp,
  subscriptionReminderKind,
  subscriptionReminderMessage,
  toWhatsappNumber,
  whatsappLink,
} from '@/lib/whatsapp'
import type { Pagination } from '@/types/auth'
import type {
  GarageReportData,
  GarageReportRow,
  GarageReportSortBy,
  SubscriptionPlan,
  SubscriptionRecordStatus,
} from '@/types/admin'

/**
 * Every field the report returns for a garage and its subscription, bar the
 * ids — the sheet is read by a person, and a UUID column is only noise.
 *
 * The derived state is written out beside the stored one: `status` is the
 * column, `Expired?` is what the end date actually says, and the two disagree
 * often enough that a sheet carrying only the first would be misread.
 */
const EXPORT_COLUMNS: ExportColumn<GarageReportRow>[] = [
  { header: 'Garage Name', value: ({ garage }) => garage.garageName, width: 24 },
  { header: 'Owner Name', value: ({ garage }) => garage.ownerName, width: 22 },
  { header: 'Mobile Number', value: ({ garage }) => garage.mobileNumber, align: 'left', width: 16 },
  { header: 'Email', value: ({ garage }) => garage.email, width: 26 },
  { header: 'City', value: ({ garage }) => garage.city, width: 16 },
  { header: 'Address', value: ({ garage }) => garage.address, wrap: true, width: 32 },
  { header: 'GST No.', value: ({ garage }) => garage.gstNo, align: 'left', width: 18 },
  { header: 'Working Days', value: ({ garage }) => garage.workingDays, width: 16 },
  { header: 'Working Hours', value: ({ garage }) => garage.workingHours, width: 20 },
  {
    header: 'Registered On',
    value: ({ garage }) => (garage.registeredAt ? formatDate(garage.registeredAt) : ''),
    align: 'center',
    width: 15,
  },
  { header: 'Plan', value: ({ subscription }) => planLabel(subscription.plan), width: 14 },
  // Written as a number, so the sheet can sort and total the column.
  { header: 'Plan Price', value: ({ subscription }) => Number(subscription.price) || 0, align: 'right', width: 12 },
  { header: 'Duration (Days)', value: ({ subscription }) => subscription.durationDays, align: 'right', width: 15 },
  { header: 'Stored Status', value: ({ subscription }) => subscription.status, align: 'center', width: 14 },
  {
    header: 'Start Date',
    value: ({ subscription }) => (subscription.startDate ? formatDate(subscription.startDate) : ''),
    align: 'center',
    width: 14,
  },
  {
    header: 'End Date',
    value: ({ subscription }) => (subscription.endDate ? formatDate(subscription.endDate) : ''),
    align: 'center',
    width: 14,
  },
  { header: 'Days Left', value: ({ subscription }) => subscription.pendingDays, align: 'right', width: 11 },
  { header: 'Expired Days Ago', value: ({ subscription }) => subscription.expiredDaysAgo, align: 'right', width: 16 },
  {
    header: 'Expired?',
    value: ({ subscription }) => (subscription.isExpired ? 'Yes' : 'No'),
    align: 'center',
    width: 10,
  },
  {
    header: 'State',
    value: ({ subscription }) => subscriptionBadge(subscription).label,
    align: 'center',
    width: 15,
  },
]

interface SortState {
  field: GarageReportSortBy
  order: SortOrder
}

/**
 * The state filters as cards, each with its platform-wide count. The values
 * are STATE_FILTERS' own, so `?state=` links keep working.
 */
const STATE_CARDS: {
  value: string
  label: string
  icon: LucideIcon
  tone: FilterCardTone
  count: 'all' | 'live' | 'expiring' | 'expired'
}[] = [
  { value: 'all', label: 'All garages', icon: Building2, tone: 'primary', count: 'all' },
  { value: 'live', label: 'Live', icon: CheckCircle2, tone: 'success', count: 'live' },
  { value: 'expiring', label: 'Expiring soon', icon: AlarmClock, tone: 'warning', count: 'expiring' },
  { value: 'expired', label: 'Expired', icon: XCircle, tone: 'danger', count: 'expired' },
]

/**
 * Opens WhatsApp with the subscription message for this garage's status —
 * free trial, expiring soon or expired — written and addressed, for the admin
 * to read and send. Nothing is rendered for a live paid plan that is not close
 * to its end, or a number WhatsApp could not open a chat with.
 */
function SubscriptionWhatsappButton({ row, wide = false }: { row: GarageReportRow; wide?: boolean }) {
  const { garage, subscription } = row
  const kind = subscriptionReminderKind(subscription)
  const number = toWhatsappNumber(garage.mobileNumber)
  if (!kind || !number) return null

  const label = `Send ${garage.ownerName} a ${SUBSCRIPTION_REMINDER_LABELS[kind]} on WhatsApp`
  const send = () =>
    openWhatsapp(
      whatsappLink(
        number,
        subscriptionReminderMessage({
          ownerName: garage.ownerName,
          garageName: garage.garageName,
          subscription,
        }),
      ),
    )

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={send}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 transition-all duration-200 hover:bg-[#1ebe5b] hover:shadow-lg hover:shadow-[#25D366]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/30',
        wide ? 'h-9 w-full rounded-lg text-sm font-semibold' : 'h-8 w-8 rounded-full hover:scale-110',
      )}
    >
      <WhatsappIcon className="h-4 w-4" />
      {wide && <span>Send {SUBSCRIPTION_REMINDER_LABELS[kind]}</span>}
    </button>
  )
}

/** Newest registration first — the API's own default. */
const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

/** The same fields the sortable table headers offer, for the card list. */
const SORT_FIELDS: SortBarField[] = [
  { key: 'garageName', label: 'Garage' },
  { key: 'ownerName', label: 'Owner' },
  { key: 'plan', label: 'Plan' },
  { key: 'endDate', label: 'Ends' },
  { key: 'pendingDays', label: 'Days left' },
  { key: 'createdAt', label: 'Registered' },
]

/** What the current order is called, for the exported sheet's header. */
const sortLabel = (sort: SortState) =>
  `${SORT_FIELDS.find((f) => f.key === sort.field)?.label ?? sort.field} (${
    sort.order === 'asc' ? 'ascending' : 'descending'
  })`

export function AdminGarages() {
  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  // `?state=` and `?plan=` open the list already narrowed — the dashboard's
  // action items link here that way. Anything unrecognised is ignored.
  const [searchParams] = useSearchParams()
  const [state, setState] = useState(() => {
    const value = searchParams.get('state')
    return STATE_FILTERS.some((f) => f.value === value) ? (value as string) : 'all'
  })
  const [plan, setPlan] = useState(() => {
    const value = searchParams.get('plan')
    return value && PLAN_FILTER_OPTIONS.some((o) => o.value === value) ? value : ''
  })
  const [status, setStatus] = useState('')

  const [rows, setRows] = useState<GarageReportRow[]>([])
  const [counts, setCounts] = useState<GarageReportData['counts'] | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // Any change to what is being asked for starts from page one. Resetting
  // during the render that changes it keeps the stale page from being fetched.
  const queryKey = `${search}|${state}|${plan}|${status}|${limit}|${sort.field}:${sort.order}`
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
      const stateParams = STATE_FILTERS.find((f) => f.value === state)?.params ?? {}

      const data = await adminService.listGarageReport({
        page,
        limit,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...stateParams,
        ...(search ? { search } : {}),
        ...(plan ? { plan: plan as SubscriptionPlan } : {}),
        ...(status ? { status: status as SubscriptionRecordStatus } : {}),
      })

      if (requestId !== latestRequest.current) return

      setRows(data.garages ?? [])
      setCounts(data.counts ?? null)
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load garages.')
      setRows([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, state, plan, status, page, limit, sort])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /** A new column starts ascending; the one already sorting flips. */
  const handleSort = (sortKey: string) =>
    setSort((current) =>
      current.field === sortKey
        ? { ...current, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field: sortKey as GarageReportSortBy, order: 'asc' },
    )

  const narrowed = Boolean(search) || state !== 'all' || Boolean(plan) || Boolean(status)

  /** What the pills and dropdowns are set to, written into the sheet's header. */
  const filterSummary = [
    STATE_FILTERS.find((f) => f.value === state)?.label,
    plan && PLAN_FILTER_OPTIONS.find((o) => o.value === plan)?.label,
    status && STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.label,
  ]
    .filter(Boolean)
    .join(' · ')

  /**
   * Downloads exactly what the list is showing — this page of it, under the
   * search and filters that are set. Asking for "All" rows first is what
   * downloads every garage.
   */
  const exportExcel = () =>
    downloadExcel(
      datedFileName('garages'),
      {
        title: 'Garage List',
        subtitle: 'GaragePro Admin — every registered garage and its subscription',
        sheetName: 'Garages',
        includeIndex: true,
        // What the sheet is a snapshot of, so a saved file explains itself.
        meta: [
          { label: 'Search', value: search || 'All garages' },
          { label: 'Filters', value: filterSummary || 'None' },
          { label: 'Sorted By', value: sortLabel(sort) },
        ],
      },
      EXPORT_COLUMNS,
      rows,
    )

  /**
   * That garage's job cards and where each one's payment stands, in a window
   * of its own beside this list — an admin comparing garages keeps the list it
   * came from rather than navigating away from it and back.
   *
   * Only the garage's id travels in the address: the job card endpoint
   * returns the garage beside its cards, and the window's header reads it
   * from there.
   */
  const openJobCards = ({ garage }: GarageReportRow) => {
    window.open(`/admin/garages/${garage.id}/job-cards`, '_blank', 'noopener')
  }

  const columns: Column<GarageReportRow>[] = [
    {
      header: 'Garage',
      sortKey: 'garageName',
      // A name is allowed two lines; past that the column has been squeezed
      // too far and the row should grow sideways into the table's own scroll
      // rather than into a four line cell.
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
          <p className="text-xs whitespace-nowrap text-slate-500">{garage.mobileNumber}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      sortKey: 'plan',
      accessor: ({ subscription }) => (
        <div className="flex flex-col items-start gap-0.5">
          <Badge tone={planTone(subscription.plan)}>{planLabel(subscription.plan)}</Badge>
          <span className="text-xs text-slate-500">{planPriceLabel(subscription.price)}</span>
        </div>
      ),
    },
    {
      header: 'Start',
      sortKey: 'startDate',
      className: 'hidden whitespace-nowrap 2xl:table-cell',
      accessor: ({ subscription }) => formatDate(subscription.startDate),
    },
    {
      header: 'Ends',
      sortKey: 'endDate',
      className: 'hidden whitespace-nowrap xl:table-cell',
      accessor: ({ subscription }) => formatDate(subscription.endDate),
    },
    {
      header: 'Days left',
      sortKey: 'pendingDays',
      className: 'whitespace-nowrap',
      accessor: ({ subscription }) => (
        <span className={`font-medium ${daysLeftClass(subscription)}`}>
          {daysLeftLabel(subscription)}
        </span>
      ),
    },
    {
      header: 'Status',
      sortKey: 'status',
      // The same state is already in the colour of "Days left" beside it —
      // red for expired, amber for expiring — so the badge only earns its
      // column once there is room to spare.
      className: 'hidden 2xl:table-cell',
      accessor: ({ subscription }) => {
        const badge = subscriptionBadge(subscription)
        return <Badge tone={badge.tone}>{badge.label}</Badge>
      },
    },
    {
      header: 'Message',
      align: 'center',
      className: 'w-[4.5rem]',
      accessor: (row) => <SubscriptionWhatsappButton row={row} />,
    },
    {
      header: 'Job Cards',
      align: 'right',
      // Until there is room to spare the action is its icon alone — the column
      // header still says what it opens and the title names the garage. The
      // word comes back with the other optional columns.
      className: 'w-[4.75rem] 2xl:w-[7.5rem]',
      accessor: (row) => (
        <ActionButton
          tone="primary"
          title={`Open ${row.garage.garageName}'s job cards and payments`}
          aria-label={`Open ${row.garage.garageName}'s job cards and payments`}
          icon={<ClipboardList className="h-3.5 w-3.5" />}
          onClick={() => openJobCards(row)}
          className="px-2.5"
        >
          <span className="hidden 2xl:inline">Details</span>
        </ActionButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Garage Subscriptions"
        subtitle="Every registered garage and its subscription"
        action={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            disabled={rows.length === 0}
            onClick={exportExcel}
          >
            <span className="hidden sm:inline">Download Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
        }
      />

      {/* The counts are the filters: tap one and the list narrows to it. */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATE_CARDS.map((card) => (
          <FilterCard
            key={card.value}
            icon={card.icon}
            label={card.label}
            tone={card.tone}
            value={counts ? formatCount(counts[card.count]) : '—'}
            selected={state === card.value}
            onClick={() => setState(card.value)}
            stackOnMobile
          />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search owner, garage, city, email or mobile..."
          className="lg:flex-1"
        />
        {/* Two dropdowns side by side need about 160px each before their
            longest option ("Any stored status") starts clipping, so below
            `sm` they stack rather than squeeze. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[26rem]">
          <Select
            aria-label="Plan"
            options={PLAN_FILTER_OPTIONS}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
          <Select
            aria-label="Stored status"
            options={STATUS_FILTER_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
      </div>

      {/* The table sorts from its headers; the cards get the same fields here. */}
      <SortBar
        className="mb-4 lg:hidden"
        fields={SORT_FIELDS}
        sortBy={sort.field}
        sortOrder={sort.order}
        onSort={handleSort}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Could not load garages"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No garages found"
          description={
            narrowed ? 'Try a different search or filter.' : 'No garage has registered yet.'
          }
        />
      ) : (
        <>
          <ResponsiveList
            data={rows}
            columns={columns}
            keyField={(r) => r.subscription.id}
            sortBy={sort.field}
            sortOrder={sort.order}
            onSort={handleSort}
            renderCard={(row) => {
              const { garage, subscription } = row
              const badge = subscriptionBadge(subscription)
              return (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{garage.garageName}</p>
                      <p className="truncate text-sm text-slate-500">{garage.ownerName}</p>
                    </div>
                    {/* Never squeezed by a long garage name — "Expiring soon"
                        broken over two lines reads as two badges. */}
                    <Badge tone={badge.tone} className="shrink-0 whitespace-nowrap">
                      {badge.label}
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
                    {/* The two dates stay whole and drop to their own line
                        rather than being split mid-value on a narrow phone. */}
                    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">
                        {formatDate(subscription.startDate)}
                      </span>
                      <span aria-hidden="true">→</span>
                      <span className="whitespace-nowrap">{formatDate(subscription.endDate)}</span>
                    </p>
                  </div>

                  {/* "Free Trial · ₹4,999.50" beside "Expired 34 days ago" is
                      wider than a 360px phone's card, so the row wraps instead
                      of pushing the days-left figure off the edge. */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge tone={planTone(subscription.plan)} className="shrink-0">
                        {planLabel(subscription.plan)}
                      </Badge>
                      <span className="truncate text-sm text-slate-500">
                        {planPriceLabel(subscription.price)}
                      </span>
                    </div>
                    <span
                      className={`whitespace-nowrap text-sm font-semibold ${daysLeftClass(
                        subscription,
                      )}`}
                    >
                      {daysLeftLabel(subscription)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <SubscriptionWhatsappButton row={row} wide />
                  </div>

                  <ActionButton
                    layout="card"
                    tone="primary"
                    className="mt-2 w-full"
                    icon={<ClipboardList className="h-4 w-4" />}
                    onClick={() => openJobCards(row)}
                  >
                    Job Cards Details
                  </ActionButton>
                </div>
              )
            }}
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
