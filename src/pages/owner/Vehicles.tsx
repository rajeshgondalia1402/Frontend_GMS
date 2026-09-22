import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Download, Eye, Phone, Plus } from 'lucide-react'
import {
  ActionButton,
  DEFAULT_PAGE_SIZE,
  PageHeader,
  PaginationBar,
  SearchInput,
  StatCard,
} from '@/components/common'
import type { Column, SortBarField, SortOrder } from '@/components/common'
import { ResponsiveList, SortBar } from '@/components/common'
import { Badge, Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { vehicleService } from '@/services/vehicleService'
import { ApiError } from '@/services/httpClient'
import { formatDate } from '@/lib/utils'
import { vehicleStatusLabel, vehicleStatusTone } from '@/lib/vehicleStatus'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import type { Pagination } from '@/types/auth'
import type { VehicleListParams, VehicleWithCustomer } from '@/types/vehicle'

/** The model, falling back to the brand where the model was left blank. */
function vehicleName(vehicle: VehicleWithCustomer): string {
  return vehicle.model || vehicle.brand || '—'
}

/** Every field the API returns for a vehicle and its owner, bar the ids. */
const EXPORT_COLUMNS: ExportColumn<VehicleWithCustomer>[] = [
  { header: 'Vehicle Number', value: (v) => v.vehicleNumber, align: 'left', width: 18 },
  { header: 'Vehicle Type', value: (v) => v.vehicleType, width: 16 },
  { header: 'Brand', value: (v) => v.brand, width: 16 },
  { header: 'Model', value: (v) => v.model, width: 18 },
  { header: 'Variant', value: (v) => v.variant, width: 16 },
  { header: 'Fuel Type', value: (v) => v.fuelType, align: 'center', width: 12 },
  { header: 'Colour', value: (v) => v.color, width: 12 },
  // Written as a number, so the sheet can sort and total it.
  { header: 'Current KM', value: (v) => v.currentKm, align: 'right', width: 12 },
  { header: 'Description', value: (v) => v.description, wrap: true, width: 32 },
  {
    header: 'Status',
    value: (v) => (v.status ? vehicleStatusLabel(v.status) : ''),
    align: 'center',
    width: 14,
  },
  {
    header: 'Insurance Expiry',
    value: (v) => (v.insuranceExpiry ? formatDate(v.insuranceExpiry) : ''),
    align: 'center',
    width: 16,
  },
  { header: 'Owner Name', value: (v) => v.customer?.fullName, width: 22 },
  { header: 'Owner Mobile', value: (v) => v.customer?.mobileNumber, align: 'left', width: 16 },
  { header: 'Owner WhatsApp', value: (v) => v.customer?.whatsappNumber, align: 'left', width: 16 },
  {
    header: 'Added On',
    value: (v) => (v.createdAt ? formatDate(v.createdAt) : ''),
    align: 'center',
    width: 14,
  },
  {
    header: 'Last Updated',
    value: (v) => (v.updatedAt ? formatDate(v.updatedAt) : ''),
    align: 'center',
    width: 14,
  },
]

/** What `GET /auth/vehicle` can order by; the API rejects anything else. */
type ApiSortField = NonNullable<VehicleListParams['sortBy']>

/**
 * Neither the vehicle type nor the owner's name is among the API's fields, so
 * those two are ordered here instead (see `sortRows`).
 */
type ClientSortField = 'vehicleType' | 'owner'

type SortField = ApiSortField | ClientSortField

interface SortState {
  field: SortField
  order: SortOrder
}

const API_SORT_FIELDS: readonly string[] = ['createdAt', 'updatedAt', 'vehicleNumber', 'status']

const isApiSort = (field: SortField): field is ApiSortField => API_SORT_FIELDS.includes(field)

const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

/** The order the list is read in: the API's own, or newest first to sort here. */
const listOrder = (sort: SortState): Pick<VehicleListParams, 'sortBy' | 'sortOrder'> =>
  isApiSort(sort.field)
    ? { sortBy: sort.field, sortOrder: sort.order }
    : { sortBy: 'createdAt', sortOrder: 'desc' }

/** The same fields the sortable table headers offer, for the card list. */
const SORT_FIELDS: SortBarField[] = [
  { key: 'vehicleType', label: 'Vehicle' },
  { key: 'vehicleNumber', label: 'Number' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Added' },
]

/** What the current order is called, for the exported sheet's header. */
const sortLabel = (sort: SortState) =>
  `${SORT_FIELDS.find((f) => f.key === sort.field)?.label ?? sort.field} (${
    sort.order === 'asc' ? 'ascending' : 'descending'
  })`

/**
 * Orders by vehicle type or owner name, neither of which the API can do. It
 * can only reach the rows that were fetched, so it orders a page at a time —
 * pick "All" rows to put the whole list in order. Anything the API has already
 * sorted comes back untouched.
 */
function sortRows(rows: VehicleWithCustomer[], sort: SortState): VehicleWithCustomer[] {
  if (isApiSort(sort.field)) return rows

  const direction = sort.order === 'asc' ? 1 : -1
  const key = (v: VehicleWithCustomer) =>
    (sort.field === 'owner' ? v.customer?.fullName : v.vehicleType) ?? ''

  return [...rows].sort((a, b) => direction * key(a).localeCompare(key(b), 'en'))
}

export function Vehicles() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  /** The garage's whole fleet, read once without a search term. */
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // A new search term or a different page size always starts from page one:
  // page 4 of the old result set says nothing about the new one. Resetting
  // during the render that changes them keeps the stale page from being asked
  // for at all, rather than fetching it and then correcting.
  // Only the order the API is asked for belongs in the key: re-ordering a page
  // in the browser neither refetches it nor sends the reader back to page one.
  const order = listOrder(sort)
  const queryKey = `${search}|${limit}|${order.sortBy}:${order.sortOrder}`
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
      // One endpoint for both: `search` is simply left off to list everything.
      const data = await vehicleService.listVehicles({
        page,
        limit,
        sortBy: order.sortBy,
        sortOrder: order.sortOrder,
        ...(search ? { search } : {}),
      })

      if (requestId !== latestRequest.current) return

      setVehicles(data.vehicles ?? [])
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load vehicles.')
      setVehicles([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, page, limit, order.sortBy, order.sortOrder])

  // Re-runs whenever the search term, the page, the page size or the API's
  // share of the order changes.
  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /**
   * The count describes the whole garage, so it is read once without a search
   * term and left alone while the box is used. Only `pagination.total` is
   * wanted, so the smallest possible page is asked for.
   */
  const loadTotal = useCallback(async () => {
    try {
      const data = await vehicleService.listVehicles({ page: 1, limit: 1 })
      setTotal(data.pagination?.total ?? (data.vehicles ?? []).length)
    } catch {
      // The list below already surfaces a failed request; the count just waits.
      setTotal(null)
    }
  }, [])

  useEffect(() => {
    void loadTotal()
  }, [loadTotal])

  /** What is on screen: the fetched page, in the chosen order. */
  const rows = useMemo(() => sortRows(vehicles, sort), [vehicles, sort])

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

  /**
   * Both buttons open the same form on the owner, who the form needs anyway:
   * `add` fills it in for that vehicle's next visit, `edit` opens it over the
   * vehicle itself. `from=vehicles` sends the back link to this tab, and the
   * row is handed over so nothing has to be fetched again.
   */
  const openVehicleForm = (vehicle: VehicleWithCustomer, action: 'add' | 'edit') => {
    const customerId = vehicle.customer?.id ?? vehicle.customerId
    if (!customerId) return

    const query = `from=vehicles&action=${action}&vehicleId=${encodeURIComponent(vehicle.id)}`
    navigate(`/app/customers/${customerId}?${query}`, { state: { vehicle } })
  }

  /**
   * A completed vehicle has nothing left running on it, so the row offers to
   * add the next one for that owner instead of showing this one's details.
   */
  const isCompleted = (vehicle: VehicleWithCustomer) => vehicle.status === 'COMPLETED'

  /**
   * Downloads exactly what the list is showing — this page of it, under the
   * search term in the box. Asking for "All" rows first is what downloads
   * everything.
   */
  const exportExcel = () =>
    downloadExcel(
      datedFileName('vehicles'),
      {
        title: 'Vehicle List',
        subtitle: user?.garageName ?? 'Garage Management System',
        sheetName: 'Vehicles',
        includeIndex: true,
        // What the sheet is a snapshot of, so a saved file explains itself.
        meta: [
          { label: 'Search', value: search || 'All vehicles' },
          { label: 'Sorted By', value: sortLabel(sort) },
        ],
      },
      EXPORT_COLUMNS,
      rows,
    )

  const columns: Column<VehicleWithCustomer>[] = [
    {
      header: 'Vehicle',
      sortKey: 'vehicleType',
      accessor: (v) => <span className="font-medium text-slate-900">{v.vehicleType || '—'}</span>,
    },
    { header: 'Model', accessor: (v) => vehicleName(v) },
    {
      header: 'Number',
      sortKey: 'vehicleNumber',
      accessor: (v) => <span className="font-mono text-xs">{v.vehicleNumber}</span>,
    },
    { header: 'Owner', sortKey: 'owner', accessor: (v) => v.customer?.fullName || '—' },
    // Nine columns want 954px and a 1024px laptop leaves 734 once the sidebar
    // has taken its 240px, so three wait for a wider screen rather than
    // pushing the Actions column out of sight. These three are the ones the
    // desk scans past: the fuel type and the service date are detail, and the
    // owner's number is one tap away on the row itself.
    {
      header: 'Fuel',
      className: 'hidden xl:table-cell',
      accessor: (v) => (v.fuelType ? <Badge tone="neutral">{v.fuelType}</Badge> : '—'),
    },
    {
      header: 'Mobile',
      className: 'hidden xl:table-cell',
      accessor: (v) => v.customer?.mobileNumber || '—',
    },
    {
      header: 'Last Service',
      sortKey: 'createdAt',
      className: 'hidden xl:table-cell',
      accessor: (v) => (v.createdAt ? formatDate(v.createdAt) : '—'),
    },
    {
      header: 'Status',
      sortKey: 'status',
      accessor: (v) =>
        v.status ? (
          <Badge tone={vehicleStatusTone(v.status)}>{vehicleStatusLabel(v.status)}</Badge>
        ) : (
          '—'
        ),
    },
    {
      header: 'Actions',
      align: 'right',
      className: 'w-[6.5rem]',
      accessor: (v) => (
        <ActionButton
          tone="primary"
          title={
            isCompleted(v)
              ? `Open a new job for ${v.vehicleNumber}`
              : `Open ${v.vehicleNumber}`
          }
          className="w-[4.25rem]"
          onClick={() => openVehicleForm(v, isCompleted(v) ? 'add' : 'edit')}
        >
          {isCompleted(v) ? 'Add' : 'View'}
        </ActionButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Vehicles" subtitle="All registered vehicles" />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:max-w-[15rem]">
        <StatCard
          label="Total Vehicles"
          value={total === null ? '—' : String(total)}
          icon={Car}
          tone="primary"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search number, brand, model or owner..."
          className="sm:flex-1"
        />
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={rows.length === 0}
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
          title="Could not load vehicles"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          description={
            search
              ? 'Try a different search.'
              : 'Vehicles are added from a customer, and show up here once they are.'
          }
        />
      ) : (
        <>
          <ResponsiveList
            data={rows}
            columns={columns}
            keyField={(v) => v.id}
            sortBy={sort.field}
            sortOrder={sort.order}
            onSort={handleSort}
            renderCard={(v) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {v.vehicleType || '—'}
                      {vehicleName(v) !== '—' && (
                        <span className="font-normal text-slate-500"> · {vehicleName(v)}</span>
                      )}
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-slate-500">{v.vehicleNumber}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {v.status && (
                      <Badge tone={vehicleStatusTone(v.status)}>{vehicleStatusLabel(v.status)}</Badge>
                    )}
                    {v.fuelType && <Badge tone="neutral">{v.fuelType}</Badge>}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Owner</p>
                    <p className="truncate text-sm text-slate-600">
                      {v.customer?.fullName || '—'}
                    </p>
                    {v.customer?.mobileNumber && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Phone className="h-3.5 w-3.5" /> {v.customer.mobileNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Last Service</p>
                    <p className="text-sm text-slate-600">
                      {v.createdAt ? formatDate(v.createdAt) : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-stretch gap-2">
                  {isCompleted(v) ? (
                    <ActionButton
                      layout="card"
                      tone="primary"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => openVehicleForm(v, 'add')}
                    >
                      Add Vehicle
                    </ActionButton>
                  ) : (
                    <ActionButton
                      layout="card"
                      tone="primary"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => openVehicleForm(v, 'edit')}
                    >
                      View Vehicle
                    </ActionButton>
                  )}
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
