import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Car, ChevronDown, Eye, Phone, Plus, Users } from 'lucide-react'
import {
  ActionButton,
  DEFAULT_PAGE_SIZE,
  PageHeader,
  PaginationBar,
  SearchInput,
} from '@/components/common'
import type { Column, SortBarField, SortOrder } from '@/components/common'
import { ResponsiveList, SortBar } from '@/components/common'
import { Button, EmptyState, ErrorState, LoadingState, Select } from '@/components/ui'
import { CustomerMoreDetails } from '@/components/customers'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import { downloadReport } from '@/lib/report'
import type { ReportFormat } from '@/lib/report'
import { ExportButtons } from '@/components/common/ExportButtons'
import type { ExportColumn } from '@/lib/excel'
import { formatDate } from '@/lib/utils'
import {
  ALL_TIME,
  CREATED_PERIOD_OPTIONS,
  periodLabel,
  periodMonths,
} from '@/lib/createdPeriod'
import type { CreatedPeriod } from '@/lib/createdPeriod'
import type { Pagination } from '@/types/auth'
import type { CustomerListParams, CustomerWithVehicles } from '@/types/customer'

/** The API caps `limit` at 100 for a page of the list. */
const MAX_LIMIT = 100

/** How many vehicles the customer has, e.g. "3 vehicles". */
function vehicleLabel(customer: CustomerWithVehicles): string {
  const count = (customer.vehicles ?? []).length
  if (count === 0) return 'No vehicles'

  return `${count} ${count === 1 ? 'vehicle' : 'vehicles'}`
}

/** Every field the API returns for a customer, bar the ids. */
const EXPORT_COLUMNS: ExportColumn<CustomerWithVehicles>[] = [
  { header: 'Customer Name', value: (c) => c.fullName, width: 24 },
  { header: 'Mobile Number', value: (c) => c.mobileNumber, align: 'left', width: 16 },
  { header: 'WhatsApp Number', value: (c) => c.whatsappNumber, align: 'left', width: 18 },
  { header: 'Email', value: (c) => c.email, width: 26 },
  { header: 'City', value: (c) => c.city, width: 16 },
  { header: 'Address', value: (c) => c.address, wrap: true, width: 34 },
  { header: 'Notes', value: (c) => c.notes, wrap: true, width: 30 },
  { header: 'Total Vehicles', value: (c) => (c.vehicles ?? []).length, align: 'center', width: 14 },
  {
    header: 'Vehicle Numbers',
    value: (c) => (c.vehicles ?? []).map((v) => v.vehicleNumber).join(', '),
    wrap: true,
    width: 28,
  },
  {
    header: 'Added On',
    value: (c) => (c.createdAt ? formatDate(c.createdAt) : ''),
    align: 'center',
    width: 14,
  },
  {
    header: 'Last Updated',
    value: (c) => (c.updatedAt ? formatDate(c.updatedAt) : ''),
    align: 'center',
    width: 14,
  },
]

/** Only these are sortable — the API rejects any other `sortBy`. */
type SortField = NonNullable<CustomerListParams['sortBy']>

interface SortState {
  field: SortField
  order: SortOrder
}

/** The API sorts the whole list, so the order holds across every page. */
const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

const sortValue = (sort: SortState) => `${sort.field}:${sort.order}`

/** The same fields the sortable table headers offer, for the card list. */
const SORT_FIELDS: SortBarField[] = [
  { key: 'fullName', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'createdAt', label: 'Created Date' },
]

/** What the current order is called, for the exported sheet's header. */
const sortLabel = (sort: SortState) =>
  `${SORT_FIELDS.find((f) => f.key === sort.field)?.label ?? sort.field} (${
    sort.order === 'asc' ? 'ascending' : 'descending'
  })`
interface CustomerStats {
  total: number
  newThisMonth: number
}

/** A label and its number side by side — small enough to read at a glance. */
function StatChip({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'success' }) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary-100 bg-primary-50 text-primary-700'
      : 'border-emerald-100 bg-emerald-50 text-emerald-700'
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${toneClass}`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-base font-bold tabular-nums">{value}</span>
    </span>
  )
}

export function Customers() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)
  /** "Created in" filter — all time, the current month or the last 2-12 months. */
  const [period, setPeriod] = useState<CreatedPeriod>(ALL_TIME)

  const [customers, setCustomers] = useState<CustomerWithVehicles[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [stats, setStats] = useState<CustomerStats | null>(null)
  /** Ids of the customers whose vehicles are shown under their row. */
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // A new search term, period, page size or order always
  // starts from page one:
  // page 4 of the old result set says nothing about the new one. Resetting
  // during the render that changes them keeps the stale page from being asked
  // for at all, rather than fetching it and then correcting.
  const queryKey = `${search}|${period}|${limit}|${sortValue(sort)}`
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
      // One endpoint for both: `search` is simply left off to list everyone.
      const data = await customerService.listCustomers({
        page,
        limit,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
        ...periodMonths(period),
      })

      if (requestId !== latestRequest.current) return

      setCustomers(data.customers ?? [])
      setPagination(data.pagination ?? null)
      // The header counts come with the list, so no separate request is needed.
      if (data.summary) {
        setStats({
          total: data.summary.totalCustomers,
          newThisMonth: data.summary.newThisMonth,
        })
      }
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load customers.')
      setCustomers([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, period, page, limit, sort])

  // Re-runs whenever the search term, period, page, page size or order changes.
  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  const openCustomer = (customer: CustomerWithVehicles) =>
    navigate(`/app/customers/${customer.id}`, { state: { customer } })

  /**
   * Clicking a header sorts by that column: a new column starts ascending, the
   * one already sorting flips between ascending and descending.
   */
  const handleSort = (sortKey: string) =>
    setSort((current) =>
      current.field === sortKey
        ? { ...current, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field: sortKey as SortField, order: 'asc' },
    )

  const toggleVehicles = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const isExpanded = (c: CustomerWithVehicles) => expanded.has(c.id)

  /**
   * Every customer gets a toggle: the details hold their contact and notes as
   * well as their vehicles, so there is something to open even with none.
   */
  const expandToggle = (c: CustomerWithVehicles) => {
    const open = isExpanded(c)
    return (
      <button
        type="button"
        onClick={() => toggleVehicles(c.id)}
        aria-expanded={open}
        title={open ? 'Hide details' : 'More details'}
        aria-label={`${open ? 'Hide' : 'Show'} details of ${c.fullName}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
      >
        {/* The same arrow the car lists use, turning as the details open. */}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    )
  }

  const columns: Column<CustomerWithVehicles>[] = [
    { header: '', className: 'w-10 pr-0', accessor: expandToggle },
    {
      header: 'Name',
      sortKey: 'fullName',
      accessor: (c) => <span className="font-medium text-slate-900">{c.fullName}</span>,
    },
    { header: 'Mobile', accessor: (c) => c.mobileNumber },
    { header: 'Vehicles', accessor: (c) => vehicleLabel(c) },
    { header: 'City', sortKey: 'city', accessor: (c) => c.city || '—' },
    {
      header: 'Created Date',
      sortKey: 'createdAt',
      accessor: (c) => (c.createdAt ? formatDate(c.createdAt) : '—'),
    },
    {
      header: 'Actions',
      align: 'right',
      className: 'w-[6.5rem]',
      // Only this opens the customer — a click anywhere else on the row does not.
      accessor: (c) => (
        <ActionButton
          tone="primary"
          title={`Open ${c.fullName}`}
          className="w-[4.25rem]"
          onClick={() => openCustomer(c)}
        >
          View
        </ActionButton>
      ),
    },
  ]

  /**
   * Downloads exactly what the list is showing — this page of it, under the
   * search term in the box. Asking for "All" rows first is what downloads
   * everything.
   */
  const exportList = (format: ReportFormat) =>
    downloadReport(
      format,
      'customers',
      {
        title: 'Customer List',
        subtitle: user?.garageName ?? 'Garage Management System',
        sheetName: 'Customers',
        includeIndex: true,
        // What the sheet is a snapshot of, so a saved file explains itself.
        meta: [
          { label: 'Search', value: search || 'All customers' },
          { label: 'Created', value: periodLabel(period) },
          { label: 'Sorted By', value: sortLabel(sort) },
        ],
      },
      EXPORT_COLUMNS,
      customers,
      { garageName: user?.garageName, ownerName: user?.ownerName, mobileNumber: user?.mobileNumber, city: user?.city, email: user?.email },
    )

  const addButton = (
    <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/customers/new')}>
      <span className="hidden sm:inline">Add Customer</span>
      <span className="sm:hidden">Add</span>
    </Button>
  )

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your garage customers"
        action={addButton}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatChip label="Total Customers" value={stats ? String(stats.total) : '—'} tone="primary" />
        <StatChip
          label="New This Month"
          value={stats ? String(stats.newThisMonth) : '—'}
          tone="success"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name or mobile number..."
          className="sm:flex-1"
        />
        <div className="sm:w-48">
          <Select
            aria-label="Created date"
            title="Created date"
            leftIcon={<CalendarDays className="h-4 w-4" />}
            options={CREATED_PERIOD_OPTIONS}
            value={period}
            onChange={(e) => setPeriod(e.target.value as CreatedPeriod)}
          />
        </div>
        <ExportButtons onExport={exportList} disabled={customers.length === 0} />
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
          title="Could not load customers"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            search || period
              ? 'Try a different search or created date, or add a new customer.'
              : 'Add your first customer to start creating job cards.'
          }
          action={
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/app/customers/new')}
            >
              Add Customer
            </Button>
          }
        />
      ) : (
        <>
          <ResponsiveList
            data={customers}
            columns={columns}
            keyField={(c) => c.id}
            sortBy={sort.field}
            sortOrder={sort.order}
            onSort={handleSort}
            isExpanded={isExpanded}
            renderExpanded={(c) => <CustomerMoreDetails customer={c} />}
            renderCard={(c) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{c.fullName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Phone className="h-3.5 w-3.5" /> {c.mobileNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <Car className="h-3.5 w-3.5" /> {(c.vehicles ?? []).length}
                    </span>
                    {expandToggle(c)}
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Vehicles</p>
                      <p className="truncate text-sm text-slate-600">{vehicleLabel(c)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Created Date</p>
                      <p className="text-sm text-slate-600">
                        {c.createdAt ? formatDate(c.createdAt) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-stretch gap-2">
                    <ActionButton
                      layout="card"
                      tone="primary"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => openCustomer(c)}
                    >
                      View Customer
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}
          />

          {pagination && (
            <PaginationBar
              pagination={pagination}
              count={customers.length}
              maxLimit={MAX_LIMIT}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}
    </div>
  )
}
