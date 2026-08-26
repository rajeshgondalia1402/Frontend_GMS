import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Phone, Car, Users, Eye } from 'lucide-react'
import { PageHeader, SearchInput, StatCard } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { CustomerVehicleList } from '@/components/customers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import type { Pagination } from '@/types/auth'
import type { CustomerWithVehicles } from '@/types/customer'

const PAGE_SIZE = 20

/** The API caps `limit` at 100; the stat cards read one page of that size. */
const STATS_LIMIT = 100

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

interface CustomerStats {
  total: number
  newThisMonth: number
  /** True when the month's count is a floor — every row read was this month. */
  partial: boolean
}

export function Customers() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  const [customers, setCustomers] = useState<CustomerWithVehicles[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<CustomerStats | null>(null)
  /** Ids of the customers whose vehicles are shown under their row. */
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  const fetchPage = useCallback(
    async (page: number) => {
      const requestId = ++latestRequest.current

      if (page === 1) setLoading(true)
      else setLoadingMore(true)
      setError(null)

      try {
        // One endpoint for both: `search` is simply left off to list everyone.
        const data = await customerService.listCustomers({
          page,
          limit: PAGE_SIZE,
          ...(search ? { search } : {}),
        })

        if (requestId !== latestRequest.current) return

        const found = data.customers ?? []
        setCustomers((current) => (page === 1 ? found : [...current, ...found]))
        setPagination(data.pagination ?? null)
      } catch (err) {
        if (requestId !== latestRequest.current) return

        setError(err instanceof ApiError ? err.message : 'Could not load customers.')
        if (page === 1) {
          setCustomers([])
          setPagination(null)
        }
      } finally {
        if (requestId === latestRequest.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [search],
  )

  // Re-runs whenever the debounced search term changes.
  useEffect(() => {
    void fetchPage(1)
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
      accessor: (c) => <span className="font-medium text-slate-900">{c.fullName}</span>,
    },
    { header: 'Mobile', accessor: (c) => c.mobileNumber },
    { header: 'Vehicles', accessor: (c) => vehicleLabel(c) },
    { header: 'City', accessor: (c) => c.city || '—' },
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

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name or mobile number..."
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Could not load customers"
          description={error}
          onRetry={() => void fetchPage(1)}
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
            <div className="mt-4 flex flex-col items-center gap-2">
              {pagination.hasNextPage && (
                <Button
                  variant="outline"
                  loading={loadingMore}
                  onClick={() => void fetchPage(pagination.page + 1)}
                >
                  Load more
                </Button>
              )}
              <p className="text-xs text-slate-400">
                Showing {customers.length} of {pagination.total}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
