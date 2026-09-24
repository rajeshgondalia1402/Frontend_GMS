import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeIndianRupee, ChevronDown, Download, Phone, Plus, Wallet } from 'lucide-react'
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
import { Button, EmptyState, ErrorState, LoadingState, useToast } from '@/components/ui'
import {
  CollectPaymentModal,
  EditPaymentModal,
  SaleStatusBadges,
  SoldCarMoreDetails,
} from '@/components/carSold'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { carSoldService } from '@/services/carSoldService'
import { ApiError } from '@/services/httpClient'
import {
  amountLabel,
  carSoldDateLabel,
  deliveredStatusLabel,
  isPartlyPaid,
  paymentStatusLabel,
  soldCarTitle,
} from '@/lib/carSold'
import { downloadCarSaleReceipt } from '@/lib/carSaleReceipt'
import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn } from '@/lib/excel'
import { formatDate } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { CarSoldPayment, SoldCarRecord, SoldCarSortField } from '@/types/carSold'

interface SortState {
  field: SoldCarSortField
  order: SortOrder
}

const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

/** What each order is called, for the exported sheet's header. */
const SORT_LABELS: Partial<Record<SoldCarSortField, string>> = {
  createdAt: 'Sold On',
  carNumber: 'Car Number',
  ownerName: 'Seller',
  sellingPrice: 'Asking Price',
}

const sortLabel = (sort: SortState) =>
  `${SORT_LABELS[sort.field] ?? sort.field} (${sort.order === 'asc' ? 'ascending' : 'descending'})`

/** Every field the API returns for a sold car, bar the ids. */
const EXPORT_COLUMNS: ExportColumn<SoldCarRecord>[] = [
  { header: 'Car Number', value: (c) => c.carNumber, align: 'center', width: 14 },
  { header: 'Company', value: (c) => c.companyName, width: 18 },
  { header: 'Car Name', value: (c) => c.carType, width: 16 },
  { header: 'Year', value: (c) => c.yearOfVehicle, align: 'center', width: 8 },
  { header: 'Seller', value: (c) => c.ownerName, width: 20 },
  { header: 'Seller Mobile', value: (c) => c.mobileNumber, width: 15 },
  { header: 'Asking Price (₹)', value: (c) => c.sellingPrice, align: 'right', width: 16 },
  {
    header: 'Buyer',
    value: (c) => c.soldCustomerDetail?.purchaseOwnerName ?? '',
    width: 20,
  },
  {
    header: 'Buyer Mobile',
    value: (c) => c.soldCustomerDetail?.purchaseOwnerMobileNo ?? '',
    width: 15,
  },
  {
    header: 'Buyer Address',
    value: (c) => c.soldCustomerDetail?.purchaseOwnerAddress ?? '',
    wrap: true,
    width: 28,
  },
  {
    header: 'Final Price (₹)',
    value: (c) => c.soldCustomerDetail?.finalSellingPrice ?? '',
    align: 'right',
    width: 16,
  },
  {
    header: 'Paid (₹)',
    value: (c) => c.soldCustomerDetail?.paidAmount ?? '',
    align: 'right',
    width: 14,
  },
  {
    header: 'Remaining (₹)',
    value: (c) => c.soldCustomerDetail?.remainingAmount ?? '',
    align: 'right',
    width: 14,
  },
  {
    header: 'Payment',
    value: (c) => (c.soldCustomerDetail ? paymentStatusLabel(c.soldCustomerDetail) : ''),
    align: 'center',
    width: 13,
  },
  {
    header: 'Delivery',
    value: (c) =>
      c.soldCustomerDetail ? deliveredStatusLabel(c.soldCustomerDetail.deliveredStatus) : '',
    align: 'center',
    width: 12,
  },
  {
    header: 'Delivered On',
    value: (c) => carSoldDateLabel(c.soldCustomerDetail?.deliveredDate) ?? '',
    align: 'center',
    width: 14,
  },
  {
    header: 'Sold On',
    value: (c) => (c.createdAt ? formatDate(c.createdAt) : ''),
    align: 'center',
    width: 14,
  },
]

/** The final price with what is still owing under it. */
function MoneyCell({ car }: { car: SoldCarRecord }) {
  const sale = car.soldCustomerDetail
  if (!sale) return <span className="text-sm text-slate-400">—</span>

  return (
    <div className="min-w-0">
      <p className="font-semibold text-slate-900">{amountLabel(sale.finalSellingPrice)}</p>
      <p
        className={`text-xs ${
          sale.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'
        }`}
      >
        {sale.remainingAmount > 0
          ? `${amountLabel(sale.remainingAmount)} left`
          : 'Fully paid'}
      </p>
    </div>
  )
}

/**
 * Car Sold Detail — the sold half of the board, from
 * `GET /api/auth/car-selling/sold`: every car this garage has sold, with the
 * deal behind it and what has been collected against it.
 *
 * A car marked sold without a buyer being recorded comes back with a `null`
 * sale rather than being left out, and is shown as exactly that.
 */
export function CarSold() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  const [cars, setCars] = useState<SoldCarRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  /** Every sold car, read without a search term. */
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Ids of the cars whose sale details are open under their row. */
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [collecting, setCollecting] = useState<SoldCarRecord | null>(null)
  /** The receipt whose amount is being corrected, with the car it is on. */
  const [editingPayment, setEditingPayment] = useState<{
    car: SoldCarRecord
    payment: CarSoldPayment
  } | null>(null)
  const [exporting, setExporting] = useState(false)
  /** The car whose receipt is being built, so its button can spin. */
  const [receipting, setReceipting] = useState<string | null>(null)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // Any change to what is being asked for starts from page one.
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
      const data = await carSoldService.listSoldCars({
        page,
        limit,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
      })

      if (requestId !== latestRequest.current) return

      setCars(data.soldCars ?? [])
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load sold cars.')
      setCars([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, page, limit, sort.field, sort.order])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /** Only `pagination.total` is wanted, so the smallest page is asked for. */
  const loadTotal = useCallback(async () => {
    try {
      const data = await carSoldService.listSoldCars({ page: 1, limit: 1 })
      setTotal(data.pagination?.total ?? (data.soldCars ?? []).length)
    } catch {
      setTotal(null)
    }
  }, [])

  useEffect(() => {
    void loadTotal()
  }, [loadTotal])

  /** A new column starts ascending; the one already sorting flips. */
  const handleSort = (sortKey: string) =>
    setSort((current) =>
      current.field === sortKey
        ? { ...current, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field: sortKey as SoldCarSortField, order: 'asc' },
    )

  const isExpanded = (car: SoldCarRecord) => expanded.has(car.id)

  const toggleDetails = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  /** The arrow that opens the rest of a sale, turning as it opens. */
  const expandToggle = (car: SoldCarRecord) => {
    const open = isExpanded(car)
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleDetails(car.id)
        }}
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} the sale of ${soldCarTitle(car)}`}
        title={open ? 'Hide details' : 'More details'}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    )
  }

  /**
   * Downloads every sold car matching the search, in the order the list is
   * sorted by — not just the page on screen. The API has no maximum page size.
   */
  const exportExcel = async () => {
    const matching = pagination?.total ?? cars.length
    if (matching === 0) return

    setExporting(true)
    try {
      const data = await carSoldService.listSoldCars({
        page: 1,
        limit: matching,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
      })
      const rows = data.soldCars ?? []

      downloadExcel(
        datedFileName('car-sold'),
        {
          title: 'Car Sold List',
          subtitle: user?.garageName ?? 'Garage Management System',
          sheetName: 'Car Sold',
          includeIndex: true,
          meta: [
            { label: 'Search', value: search || 'All sold cars' },
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

  /**
   * Opens the sale for correcting. The row goes along in the navigation state
   * so the form opens filled in at once, without reading the sale again.
   */
  const openEdit = (car: SoldCarRecord) => {
    if (!car.soldCustomerDetail) return
    navigate(`/app/car-sold/${car.soldCustomerDetail.id}/edit`, { state: { car } })
  }

  /**
   * Downloads the sale's receipt as a PDF. The sale is read again first so the
   * receipt carries every payment taken since the page loaded; if that read
   * fails, the row on screen is printed as it stands.
   */
  const downloadReceipt = async (car: SoldCarRecord) => {
    const sale = car.soldCustomerDetail
    if (!sale) return

    setReceipting(car.id)
    try {
      const fresh = await carSoldService.getSoldCar(sale.id).catch(() => car)
      downloadCarSaleReceipt({
        garage: {
          name: user?.garageName,
          ownerName: user?.ownerName,
          mobile: user?.mobileNumber,
          email: user?.email,
          city: user?.city,
        },
        car: fresh,
      })
    } catch {
      toast('Could not build the receipt.', 'error')
    } finally {
      setReceipting(null)
    }
  }

  const receiptButton = (car: SoldCarRecord, layout?: 'card') =>
    car.soldCustomerDetail ? (
      <ActionButton
        layout={layout}
        tone="money"
        title={`Download the receipt for ${soldCarTitle(car)}`}
        className={layout ? undefined : 'w-[4.75rem]'}
        loading={receipting === car.id}
        onClick={() => void downloadReceipt(car)}
      >
        Receipt
      </ActionButton>
    ) : null

  /** Only a car with a buyer recorded has a sale to edit. */
  const editButton = (car: SoldCarRecord, layout?: 'card') =>
    car.soldCustomerDetail ? (
      <ActionButton
        layout={layout}
        tone="neutral"
        title={`Edit the sale of ${soldCarTitle(car)}`}
        className={layout ? undefined : 'w-[4.25rem]'}
        onClick={() => openEdit(car)}
      >
        Edit
      </ActionButton>
    ) : null

  /** Only a sale with money still owing has anything left to collect. */
  const collectButton = (car: SoldCarRecord, layout?: 'card') =>
    isPartlyPaid(car.soldCustomerDetail) ? (
      <ActionButton
        layout={layout}
        tone="primary"
        title={`Collect payment from ${car.soldCustomerDetail?.purchaseOwnerName}`}
        className={layout ? undefined : 'w-[4.25rem]'}
        onClick={() => setCollecting(car)}
      >
        Collect
      </ActionButton>
    ) : null

  const columns: Column<SoldCarRecord>[] = [
    { header: '', className: 'w-10 pr-0', accessor: expandToggle },
    {
      header: 'Car',
      sortKey: 'carNumber',
      accessor: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{soldCarTitle(c)}</p>
          <p className="truncate text-xs text-slate-500">{c.carNumber ?? '—'}</p>
        </div>
      ),
    },
    {
      header: 'Seller',
      sortKey: 'ownerName',
      accessor: (c) => (
        <div className="min-w-0">
          <p className="truncate text-slate-800">{c.ownerName}</p>
          <p className="text-xs text-slate-500">{c.mobileNumber}</p>
        </div>
      ),
    },
    {
      header: 'Buyer',
      accessor: (c) =>
        c.soldCustomerDetail ? (
          <div className="min-w-0">
            <p className="truncate text-slate-800">{c.soldCustomerDetail.purchaseOwnerName}</p>
            <p className="text-xs text-slate-500">
              {c.soldCustomerDetail.purchaseOwnerMobileNo}
            </p>
          </div>
        ) : (
          <span className="text-sm text-slate-400">No buyer recorded</span>
        ),
    },
    {
      header: 'Sale Price',
      align: 'right',
      accessor: (c) => <MoneyCell car={c} />,
    },
    {
      header: 'Status',
      accessor: (c) => <SaleStatusBadges sale={c.soldCustomerDetail} />,
    },
    {
      header: 'Actions',
      align: 'right',
      className: 'w-[16.5rem]',
      accessor: (c) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {collectButton(c)}
          {receiptButton(c)}
          {editButton(c) ?? <span className="text-sm text-slate-300">—</span>}
        </div>
      ),
    },
  ]

  const renderCard = (c: SoldCarRecord) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <BadgeIndianRupee className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{soldCarTitle(c)}</p>
          <p className="truncate text-sm text-slate-500">{c.carNumber ?? '—'}</p>
        </div>
        <div className="shrink-0 text-right">
          <MoneyCell car={c} />
        </div>
      </div>

      <SaleStatusBadges sale={c.soldCustomerDetail} className="mt-3" />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        {c.soldCustomerDetail ? (
          <>
            <p className="min-w-0 truncate text-sm text-slate-700">
              {c.soldCustomerDetail.purchaseOwnerName}
            </p>
            <div className="flex shrink-0 items-center gap-2.5">
              <a
                href={`tel:${c.soldCustomerDetail.purchaseOwnerMobileNo}`}
                className="flex items-center gap-1.5 text-sm font-medium text-primary-700"
              >
                <Phone className="h-3.5 w-3.5" /> {c.soldCustomerDetail.purchaseOwnerMobileNo}
              </a>
              {expandToggle(c)}
            </div>
          </>
        ) : (
          <>
            <p className="min-w-0 truncate text-sm text-slate-500">No buyer recorded</p>
            {expandToggle(c)}
          </>
        )}
      </div>

      {c.soldCustomerDetail && (
        <div className="mt-3 flex items-stretch gap-2">
          {collectButton(c, 'card')}
          {receiptButton(c, 'card')}
          {editButton(c, 'card')}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Car Sold Detail"
        subtitle="Cars your garage has sold and who bought them"
        action={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/app/car-sold/new')}
          >
            <span className="hidden sm:inline">Add Car Sold</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:max-w-[15rem]">
        <StatCard
          label="Cars Sold"
          value={total === null ? '—' : String(total)}
          icon={Wallet}
          tone="primary"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search car number, seller, buyer, company or mobile..."
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
          title="Could not load sold cars"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : cars.length === 0 ? (
        <EmptyState
          icon={BadgeIndianRupee}
          title="No sold cars found"
          description={
            search
              ? 'Try a different search.'
              : 'Record a sale with Add Car Sold — a car that is paid off, or handed over, moves here from the selling board.'
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
            isExpanded={isExpanded}
            renderExpanded={(c) => (
              <SoldCarMoreDetails
                car={c}
                onEditPayment={(payment) => setEditingPayment({ car: c, payment })}
              />
            )}
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

      <EditPaymentModal
        open={Boolean(editingPayment)}
        car={editingPayment?.car ?? null}
        payment={editingPayment?.payment ?? null}
        onClose={() => setEditingPayment(null)}
        // A corrected amount changes the row's money and may settle the sale.
        onSaved={() => void fetchPage()}
      />

      <CollectPaymentModal
        open={Boolean(collecting)}
        car={collecting}
        onClose={() => setCollecting(null)}
        // The receipt changes the row's money and may settle the sale, so the
        // page is read again rather than patched from the response.
        onCollected={() => {
          void fetchPage()
          void loadTotal()
        }}
      />
    </div>
  )
}
