import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Phone, Car, Users, Eye, Download } from 'lucide-react'
import { DEFAULT_PAGE_SIZE, PageHeader, PaginationBar, SearchInput, StatCard } from '@/components/common'
import type { Column, SortBarField, SortOrder } from '@/components/common'
import { ResponsiveList, SortBar } from '@/components/common'
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { CustomerVehicleList } from '@/components/customers'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import { formatDate } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { CustomerListParams, CustomerWithVehicles } from '@/types/customer'

/** The API caps `limit` at 100 — both for a page of the list and for the stats. */
const MAX_LIMIT = 100
const STATS_LIMIT = MAX_LIMIT

/** How many vehicles the customer has, e.g. "3 vehicles". */
function vehicleLabel(customer: CustomerWithVehicles): string {
  const count = (customer.vehicles ?? []).length
  if (count === 0) return 'No vehicles'

  return `${count} ${count === 1 ? 'vehicle' : 'vehicles'}`
}

function countCreatedThisMonth(customers: CustomerWithVehicles[], now: Date = new Date()): number {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  return customers.filter((c) => {
    if (!c.createdAt) return false
    const created = new Date(c.createdAt).getTime()
    return !Number.isNaN(created) && created >= startOfMonth
  }).length
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
  { key: 'createdAt', label: 'Added' },
]

/** What the current order is called, for the exported sheet's header. */
const sortLabel = (sort: SortState) =>
  `${SORT_FIELDS.find((f) => f.key === sort.field)?.label ?? sort.field} (${
    sort.order === 'asc' ? 'ascending' : 'descending'
  })`
interface CustomerStats {
  total: number
  newThisMonth: number
  /** True when the month's count is a floor — every row read was this month. */
  partial: boolean
}

export function Customers() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

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

  // A new search term, a different page size or a different order always
  // starts from page one:
  // page 4 of the old result set says nothing about the new one. Resetting
  // during the render that changes them keeps the stale page from being asked
  // for at all, rather than fetching it and then correcting.
  const queryKey = `${search}|${limit}|${sortValue(sort)}`
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
      })

      if (requestId !== latestRequest.current) return

      setCustomers(data.customers ?? [])
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load customers.')
      setCustomers([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, page, limit, sort])

  // Re-runs whenever the search term, page, page size or order changes.
  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /**
   * The stat cards describe the whole garage, so they are read once without a
   * search term and left alone while the box is used. The list comes back
   * newest first, so the customers added this month are the leading rows —
   * counting them off one page of 100 is exact unless every row read is from
   * this month, in which case the count is shown as a floor ("100+").
   */
  const loadStats = useCallback(async () => {
    try {
      const data = await customerService.listCustomers({
        page: 1,
        limit: STATS_LIMIT,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      const found = data.customers ?? []
      const newThisMonth = countCreatedThisMonth(found)
      setStats({
        total: data.pagination?.total ?? found.length,
        newThisMonth,
        partial: newThisMonth === found.length && Boolean(data.pagination?.hasNextPage),
      })
    } catch {
      // The list below already surfaces a failed request; the cards just wait.
      setStats(null)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

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

  /** Only customers with vehicles get a toggle; the rest keep the column blank. */
  const expandToggle = (c: CustomerWithVehicles) => {
    if ((c.vehicles ?? []).length === 0) return null

    const open = isExpanded(c)
    return (
      <button
        type="button"
        onClick={() => toggleVehicles(c.id)}
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} vehicles of ${c.fullName}`}
        className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
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
      header: '',
      className: 'text-right',
      // Only this opens the customer — a click anywhere else on the row does not.
      accessor: (c) => (
        <button
          type="button"
          onClick={() => openCustomer(c)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          View
        </button>
      ),
    },
  ]

  /**
   * Downloads exactly what the list is showing — this page of it, under the
   * search term in the box. Asking for "All" rows first is what downloads
   * everything.
   */
  const exportExcel = () =>
    downloadExcel(
      datedFileName('customers'),
      {
        title: 'Customer List',
        subtitle: user?.garageName ?? 'Garage Management System',
        sheetName: 'Customers',
        includeIndex: true,
        // What the sheet is a snapshot of, so a saved file explains itself.
        meta: [
          { label: 'Search', value: search || 'All customers' },
          { label: 'Sorted By', value: sortLabel(sort) },
        ],
      },
      EXPORT_COLUMNS,
      customers,
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

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard
          label="Total Customers"
          value={stats ? String(stats.total) : '—'}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="New this month"
          value={stats ? `${stats.newThisMonth}${stats.partial ? '+' : ''}` : '—'}
          icon={Plus}
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
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={customers.length === 0}
          onClick={exportExcel}
        >
          Download Excel
        </Button>
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
            search
              ? 'Try a different search, or add your first customer.'
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
            renderExpanded={(c) => <CustomerVehicleList vehicles={c.vehicles ?? []} />}
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
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Vehicles</p>
                    <p className="truncate text-sm text-slate-600">{vehicleLabel(c)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="h-4 w-4" />}
                    onClick={() => openCustomer(c)}
                  >
                    View
                  </Button>
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
