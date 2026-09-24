import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CarFront, ChevronDown, Download, Phone, Plus } from 'lucide-react'
import {
  ActionButton,
  DEFAULT_PAGE_SIZE,
  PageHeader,
  PaginationBar,
  ResponsiveList,
  SearchInput,
  StatCard,
} from '@/components/common'
import type { Column, SortOrder } from '@/components/common'
import { Button, EmptyState, ErrorState, LoadingState, Modal, useToast } from '@/components/ui'
import { CarSellingDetailsModal, CarSellingMoreDetails } from '@/components/carSelling'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { carSellingService } from '@/services/carSellingService'
import { ApiError } from '@/services/httpClient'
import {
  carOwnerLabel,
  carTitle,
  insuranceDateLabel,
  isInsuranceExpired,
  sellingPriceLabel,
} from '@/lib/carSelling'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import { formatDate } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { CarSellingRecord, CarSellingSortField } from '@/types/carSelling'

interface SortState {
  field: CarSellingSortField
  order: SortOrder
}

const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

/** What each order is called, for the exported sheet's header. */
const SORT_LABELS: Partial<Record<CarSellingSortField, string>> = {
  createdAt: 'Added',
  sellingPrice: 'Price',
  companyName: 'Car',
  carNumber: 'Car Number',
  ownerName: 'Owner',
}

/** What the current order is called, for the exported sheet's header. */
const sortLabel = (sort: SortState) =>
  `${SORT_LABELS[sort.field] ?? sort.field} (${
    sort.order === 'asc' ? 'ascending' : 'descending'
  })`

const yesNo = (value: boolean) => (value ? 'Yes' : 'No')

/** "Valid", "Expired" or "No" — the checkbox read against the date. */
function insuranceStatus(car: CarSellingRecord): string {
  if (!car.insurance) return 'No'
  return isInsuranceExpired(car.insuranceDate) ? 'Expired' : 'Valid'
}

/** Every field the API returns for a car, bar the id. */
const EXPORT_COLUMNS: ExportColumn<CarSellingRecord>[] = [
  { header: 'Company', value: (c) => c.companyName, width: 18 },
  { header: 'Car Name', value: (c) => c.carType, width: 16 },
  { header: 'Car Number', value: (c) => c.carNumber, align: 'center', width: 14 },
  // Numbers stay numbers, so the sheet can sort, filter and total them.
  { header: 'Year', value: (c) => c.yearOfVehicle, align: 'center', width: 8 },
  { header: 'Ownership', value: (c) => carOwnerLabel(c.carOwner), align: 'center', width: 12 },
  { header: 'Fuel Type', value: (c) => c.fuelType, align: 'center', width: 12 },
  { header: 'Color', value: (c) => c.carColor, align: 'center', width: 12 },
  { header: 'Selling Price (₹)', value: (c) => c.sellingPrice, align: 'right', width: 16 },
  { header: 'Insurance', value: insuranceStatus, align: 'center', width: 11 },
  {
    header: 'Insurance Valid Till',
    value: (c) => insuranceDateLabel(c.insuranceDate),
    align: 'center',
    width: 18,
  },
  { header: 'PUC', value: (c) => yesNo(c.puc), align: 'center', width: 8 },
  { header: 'Accidental', value: (c) => yesNo(c.isAccidental), align: 'center', width: 11 },
  { header: 'Owner Name', value: (c) => c.ownerName, width: 22 },
  { header: 'Mobile Number', value: (c) => c.mobileNumber, align: 'left', width: 15 },
  { header: 'Address', value: (c) => c.address, wrap: true, width: 30 },
  { header: 'Description', value: (c) => c.description, wrap: true, width: 36 },
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

/** The price, or a quiet note while none has been agreed. */
function PriceText({ price, className = '' }: { price: number | null; className?: string }) {
  const label = sellingPriceLabel(price)
  return label ? (
    <span className={`font-semibold text-slate-900 ${className}`}>{label}</span>
  ) : (
    <span className="text-sm text-slate-400">Price not set</span>
  )
}

/**
 * "GJ01AB1234 · 2018" under a card's title — the table gives the number a
 * column of its own instead. The rest waits under the arrow either way.
 */
function carSubtitle(car: CarSellingRecord): string {
  return [car.carNumber, car.yearOfVehicle].filter(Boolean).join(' · ')
}

export function CarSelling() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  const [cars, setCars] = useState<CarSellingRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  /** Every car on the board, read without a search term. */
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Ids of the cars whose remaining details are open under their row. */
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const [viewing, setViewing] = useState<CarSellingRecord | null>(null)
  const [deleting, setDeleting] = useState<CarSellingRecord | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // Any change to what is being asked for starts from page one: page 4 of the
  // old result set says nothing about the new one.
  const queryKey = `${search}|${limit}|${sort.field}:${sort.order}`
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
      const data = await carSellingService.listCarSellings({
        page,
        limit,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
      })

      if (requestId !== latestRequest.current) return

      setCars(data.carSellings ?? [])
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load cars for sale.')
      setCars([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, page, limit, sort.field, sort.order])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /** Only `pagination.total` is wanted, so the smallest possible page is asked for. */
  const loadTotal = useCallback(async () => {
    try {
      const data = await carSellingService.listCarSellings({ page: 1, limit: 1 })
      setTotal(data.pagination?.total ?? (data.carSellings ?? []).length)
    } catch {
      // The list below already surfaces a failed request; the count just waits.
      setTotal(null)
    }
  }, [])

  useEffect(() => {
    void loadTotal()
  }, [loadTotal])

  const isExpanded = (car: CarSellingRecord) => expanded.has(car.id)

  const toggleDetails = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  /** The arrow that opens the rest of a car's details, turning as it opens. */
  const expandToggle = (car: CarSellingRecord) => {
    const open = isExpanded(car)
    return (
      <button
        type="button"
        onClick={(e) => {
          // The row itself opens the car; this arrow only unfolds it.
          e.stopPropagation()
          toggleDetails(car.id)
        }}
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} more details of ${carTitle(car)}`}
        title={open ? 'Hide details' : 'More details'}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
    )
  }

  /** A new column starts ascending; the one already sorting flips. */
  const handleSort = (sortKey: string) =>
    setSort((current) =>
      current.field === sortKey
        ? { ...current, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field: sortKey as CarSellingSortField, order: 'asc' },
    )

  /**
   * Adding and editing are pages of their own, like customers and job cards.
   * The row goes along in the navigation state so the edit form opens filled
   * in without a second request; the list reads itself again on the way back.
   */
  const openAdd = () => navigate('/app/car-selling/new')

  const openEdit = (car: CarSellingRecord) =>
    navigate(`/app/car-selling/${encodeURIComponent(car.id)}/edit`, { state: { car } })

  const openDelete = (car: CarSellingRecord) => {
    setViewing(null)
    setDeleting(car)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)

    try {
      await carSellingService.deleteCarSelling(deleting.id)
      toast('Car removed from the list', 'success')
      setDeleting(null)
      void loadTotal()
      // The last car on a later page leaves that page empty; step back one.
      if (cars.length === 1 && page > 1) setPage(page - 1)
      else void fetchPage()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not delete the car.', 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  /**
   * Downloads every car matching the search in the box, in the order the list
   * is sorted by — not just the page on screen. The API has no maximum page
   * size, so one request for as many rows as there are covers them all.
   */
  const exportExcel = async () => {
    const matching = pagination?.total ?? cars.length
    if (matching === 0) return

    setExporting(true)
    try {
      const data = await carSellingService.listCarSellings({
        page: 1,
        limit: matching,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
      })
      const rows = data.carSellings ?? []

      downloadExcel(
        datedFileName('car-selling'),
        {
          title: 'Car Selling List',
          subtitle: user?.garageName ?? 'Garage Management System',
          sheetName: 'Car Selling',
          includeIndex: true,
          // What the sheet is a snapshot of, so a saved file explains itself.
          meta: [
            { label: 'Search', value: search || 'All cars' },
            { label: 'Sorted By', value: sortLabel(sort) },
            { label: 'Total Cars', value: rows.length },
          ],
        },
        EXPORT_COLUMNS,
        rows,
      )
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not download the list.', 'error')
    } finally {
      setExporting(false)
    }
  }

  // Only what a garage needs to recognise a car and quote it; everything else
  // lives in the block the arrow in the first column opens.
  const columns: Column<CarSellingRecord>[] = [
    { header: '', className: 'w-10 pr-0', accessor: expandToggle },
    {
      header: 'Car',
      sortKey: 'companyName',
      accessor: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{carTitle(c)}</p>
          {c.yearOfVehicle && <p className="text-xs text-slate-500">{c.yearOfVehicle}</p>}
        </div>
      ),
    },
    {
      header: 'Car Number',
      sortKey: 'carNumber',
      accessor: (c) => (
        <span className="font-medium tracking-wide text-slate-800">{c.carNumber || '—'}</span>
      ),
    },
    {
      header: 'Owner',
      sortKey: 'ownerName',
      accessor: (c) => <span className="truncate text-slate-800">{c.ownerName}</span>,
    },
    {
      header: 'Mobile Number',
      accessor: (c) => <span className="text-slate-700">{c.mobileNumber}</span>,
    },
    {
      header: 'Price',
      sortKey: 'sellingPrice',
      align: 'right',
      accessor: (c) => <PriceText price={c.sellingPrice} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (c) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <ActionButton
            tone="primary"
            title={`Edit ${carTitle(c)}`}
            className="w-[4.25rem]"
            onClick={() => openEdit(c)}
          >
            Edit
          </ActionButton>
          <ActionButton
            tone="danger"
            title={`Delete ${carTitle(c)}`}
            className="w-[4.25rem]"
            onClick={() => openDelete(c)}
          >
            Delete
          </ActionButton>
        </div>
      ),
    },
  ]

  const renderCard = (c: CarSellingRecord) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => setViewing(c)}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <CarFront className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900">{carTitle(c)}</span>
          <span className="block truncate text-sm text-slate-500">
            {carSubtitle(c) || 'Number and year not added'}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <PriceText price={c.sellingPrice} className="text-base" />
        </span>
      </button>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="min-w-0 truncate text-sm text-slate-700">{c.ownerName}</p>
        <div className="flex shrink-0 items-center gap-2.5">
          <a
            href={`tel:${c.mobileNumber}`}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-700"
          >
            <Phone className="h-3.5 w-3.5" /> {c.mobileNumber}
          </a>
          {expandToggle(c)}
        </div>
      </div>

      <div className="mt-3 flex items-stretch gap-2">
        <ActionButton layout="card" tone="primary" onClick={() => openEdit(c)}>
          Edit
        </ActionButton>
        <ActionButton layout="card" tone="danger" onClick={() => openDelete(c)}>
          Delete
        </ActionButton>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Car Selling"
        subtitle="Used cars your garage is selling"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            <span className="hidden sm:inline">Add Car</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:max-w-[15rem]">
        <StatCard
          label="Cars for Sale"
          value={total === null ? '—' : String(total)}
          icon={CarFront}
          tone="primary"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search owner, company, car name, mobile or year..."
          className="sm:flex-1"
        />
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          loading={exporting}
          disabled={loading || cars.length === 0}
          onClick={() => void exportExcel()}
        >
          Download Excel
        </Button>
      </div>


      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Could not load cars for sale"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : cars.length === 0 ? (
        <EmptyState
          icon={CarFront}
          title="No cars found"
          description={
            search ? 'Try a different search.' : 'Add the first used car your garage is selling.'
          }
        />
      ) : (
        <>
          <ResponsiveList
            data={cars}
            columns={columns}
            keyField={(c) => c.id}
            sortBy={sort.field}
            sortOrder={sort.order}
            onSort={handleSort}
            onRowClick={(c) => setViewing(c)}
            isExpanded={isExpanded}
            renderExpanded={(c) => <CarSellingMoreDetails car={c} />}
            renderCard={renderCard}
          />

          {pagination && (
            <PaginationBar
              pagination={pagination}
              count={cars.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}

      <CarSellingDetailsModal
        open={Boolean(viewing)}
        car={viewing}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Delete Car"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              disabled={deleteBusy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              Delete
            </Button>
          </div>
        }
      >
        {deleting && (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="text-sm text-slate-600">
              Remove <span className="font-semibold text-slate-900">{carTitle(deleting)}</span>{' '}
              listed by <span className="font-semibold text-slate-900">{deleting.ownerName}</span>{' '}
              from the selling list?
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
