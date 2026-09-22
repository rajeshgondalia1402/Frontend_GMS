import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  FileText,
  Gauge,
  IndianRupee,
  MapPin,
  Phone,
  Download,
  Printer,
  RefreshCw,
  User,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DEFAULT_PAGE_SIZE,
  FilterButton,
  PaginationBar,
  SearchInput,
  SortBar,
} from '@/components/common'
import type { SortBarField } from '@/components/common'
import { Badge, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import {
  PAYMENT_FILTERS,
  STATUS_FILTERS,
  matchesJobCardSearch,
  sortJobCards,
  summariseJobCards,
} from '@/lib/adminJobCards'
import type { JobCardSortField, JobCardSummary } from '@/lib/adminJobCards'
import {
  JOB_CARD_EXPORT_COLUMNS,
  formatAmount,
  formatMoney,
  formatServiceDate,
  jobCardStatusLabel,
  jobCardStatusTone,
  vehicleDisplayName,
} from '@/lib/jobCard'
import { datedFileName, downloadExcel } from '@/lib/excel'
import { paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import { staffCategoryLabel } from '@/lib/staff'
import { cn } from '@/lib/utils'
import type { GarageIdentity } from '@/types/admin'
import type { JobCardRecord } from '@/types/jobCard'
import type { StaffCategory } from '@/types/staff'

/**
 * How many cards come back per request while the window loads the garage.
 * Large, because the figures above the list count every card the garage has
 * rather than the page that happens to be on screen — a "total billed" that
 * only added up ten rows would be worse than no figure at all.
 */
const FETCH_PAGE_SIZE = 200

/** A ceiling, so one very busy garage cannot hold the window open forever. */
const MAX_CARDS = 2000

interface SortState {
  field: JobCardSortField
  order: 'asc' | 'desc'
}

/** Newest service first, which is the order a garage's book is read in. */
const DEFAULT_SORT: SortState = { field: 'serviceDate', order: 'desc' }

/**
 * Every job card of one garage, in pages, newest first — and the garage the
 * API says they belong to, which is what titles the window.
 *
 * The pages after the first go out together: they are independent reads and
 * the window has nothing to show until it has all of them.
 */
async function fetchAllJobCards(
  garageId: string,
): Promise<{ garage: GarageIdentity | null; cards: JobCardRecord[] }> {
  const query = { limit: FETCH_PAGE_SIZE, sortBy: 'createdAt', sortOrder: 'desc' } as const

  const first = await adminService.listGarageJobCards(garageId, { ...query, page: 1 })
  const cards = [...(first.jobCards ?? [])]

  const pageCap = Math.ceil(MAX_CARDS / FETCH_PAGE_SIZE)
  const totalPages = Math.min(first.pagination?.totalPages ?? 1, pageCap)

  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        adminService.listGarageJobCards(garageId, { ...query, page: i + 2 }),
      ),
    )
    for (const page of rest) cards.push(...(page.jobCards ?? []))
  }

  return { garage: first.garage ?? null, cards }
}

/** One figure above the list, in its own colour. */
function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card sm:p-4">
      {/* The icon shares its line with the label rather than with the figure:
          two tiles across a phone leaves each about 140px, and a figure like
          ₹45,500.00 needs all of it. */}
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
      <p className="mt-1 truncate text-lg font-bold tabular-nums text-slate-900 sm:text-xl xl:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{hint}</p>
    </div>
  )
}

/** The four figures the window opens with, read off every card of the garage. */
function SummaryTiles({ summary }: { summary: JobCardSummary }) {
  const plural = (count: number) => (count === 1 ? '' : 's')

  return (
    // Two across on a phone, not one: stacked full width these four tiles came
    // to 470px, which pushed the job cards themselves off the first screen.
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      <StatTile
        icon={Wrench}
        label="Job Cards"
        value={String(summary.total)}
        hint={`${summary.pending} pending · ${summary.delivered} delivered`}
        accent="bg-primary-50 text-primary-600"
      />
      <StatTile
        icon={FileText}
        label="Total Billed"
        value={formatMoney(summary.billed)}
        hint="Everything these cards add up to"
        accent="bg-sky-50 text-sky-600"
      />
      <StatTile
        icon={Wallet}
        label="Settled"
        value={formatMoney(summary.paidValue)}
        hint={`${summary.paidCount} card${plural(summary.paidCount)} fully paid`}
        accent="bg-emerald-50 text-emerald-600"
      />
      <StatTile
        icon={AlertCircle}
        label="Outstanding"
        value={formatMoney(summary.outstandingValue)}
        hint={`Billed on ${summary.outstandingCount} card${plural(
          summary.outstandingCount,
        )} not fully paid`}
        accent="bg-amber-50 text-amber-600"
      />
    </div>
  )
}

/** A label over its value — the shape every field in the detail panel takes. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-900">{value || '—'}</p>
    </div>
  )
}

/**
 * One card in full, under the row it was opened from.
 *
 * `GET /api/admin/garage/:garageId/jobcard/:id` answers in exactly the shape a
 * row of the list has, so the row already in hand paints this while the request
 * confirms it — and where the request fails the panel still reads, rather than
 * showing an error in place of data the window already holds.
 */
function JobCardDetail({ garageId, row }: { garageId: string; row: JobCardRecord }) {
  const [card, setCard] = useState<JobCardRecord>(row)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let live = true

    setCard(row)
    setLoading(true)
    setStale(false)

    adminService
      .getGarageJobCard(garageId, row.id)
      .then((full) => {
        if (live) setCard(full)
      })
      .catch(() => {
        if (live) setStale(true)
      })
      .finally(() => {
        if (live) setLoading(false)
      })

    return () => {
      live = false
    }
    // The row is re-read only when it is a different card: re-running this on
    // every new object identity would refetch the card on each parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garageId, row.id])

  const vehicle = card.vehicle
  const customer = vehicle?.customer
  const staff = card.assignedStaff
  const items = card.items ?? []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4">
        <Field label="Customer" value={customer?.fullName ?? ''} />
        <Field label="Mobile" value={customer?.mobileNumber ?? ''} />
        <Field label="Vehicle" value={vehicle ? vehicleDisplayName(vehicle) : ''} />
        <Field label="Vehicle Number" value={vehicle?.vehicleNumber ?? ''} />
        <Field label="Vehicle Type" value={vehicle?.vehicleType ?? ''} />
        <Field
          label="Current KM"
          value={
            typeof vehicle?.currentKm === 'number' ? vehicle.currentKm.toLocaleString('en-IN') : ''
          }
        />
        <Field label="Assigned To" value={staff?.name ?? 'Nobody yet'} />
        <Field
          label="Role"
          value={staff ? staff.role || staffCategoryLabel(staff.category as StaffCategory) : ''}
        />
      </div>

      {vehicle?.description?.trim() && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Complaint</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {vehicle.description.trim()}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Billed Items ({items.length})
          </p>
          {loading && <span className="text-xs text-slate-400">Loading latest…</span>}
          {stale && (
            <span className="text-xs text-amber-600">Showing what the list already holds</span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">Nothing billed on this card yet.</p>
        ) : (
          <>
            {/* Four money columns need about 384px, which a 320px phone cannot
                give inside a card — the table would scroll sideways within the
                panel. Below `sm` the same lines are stacked instead, the way
                the garage's own job card screen reads them. */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{item.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.qty} × {formatMoney(item.rate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {formatMoney(item.total)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {formatMoney(card.totalAmount)}
                </span>
              </div>
            </div>

            <div className="scrollbar-thin hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[24rem] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">{item.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{item.qty}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {formatMoney(item.rate)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-slate-700">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                    {formatMoney(card.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          <Wallet className="h-4 w-4 text-slate-400" /> Payment
          <Badge tone={paymentStatusTone(card.paymentStatus)}>
            {paymentStatusLabel(card.paymentStatus)}
          </Badge>
        </span>
        <span className="flex items-center gap-2 text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400" /> Service
          <span className="font-medium text-slate-900">{formatServiceDate(card.serviceDate)}</span>
        </span>
        {card.completionDate && (
          <span className="flex items-center gap-2 text-slate-600">
            <Gauge className="h-4 w-4 text-slate-400" /> Completed
            <span className="font-medium text-slate-900">
              {formatServiceDate(card.completionDate)}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

/** The sortable headers, and what each one orders the loaded cards by. */
const HEADERS: { label: string; field?: JobCardSortField; className?: string }[] = [
  { label: 'Job No.', field: 'jobNumber', className: 'w-[9.5rem]' },
  { label: 'Service Date', field: 'serviceDate', className: 'w-[9rem]' },
  { label: 'Customer', field: 'customer' },
  { label: 'Vehicle', className: 'w-[13rem]' },
  { label: 'Status', className: 'w-[7rem]' },
  { label: 'Payment', field: 'paymentStatus', className: 'w-[8rem]' },
  { label: 'Amount', field: 'totalAmount', className: 'w-[8.5rem] text-right' },
]

/**
 * The same fields the sortable headers offer, for the card list — a card has no
 * header to click, so below `lg` they are a row of buttons instead, exactly as
 * on the garage list.
 */
const SORT_FIELDS: SortBarField[] = HEADERS.filter((header) => header.field).map((header) => ({
  key: header.field as string,
  label: header.label,
}))

/**
 * The list itself: a table from `lg` up, stacked cards below it, and the same
 * detail panel opening under either.
 *
 * Written here rather than through `ResponsiveList` because the row and the
 * card each carry their own disclosure — in the row it is a column of its own,
 * on the card it sits in the header beside the status.
 */
function JobCardList({
  garageId,
  rows,
  sort,
  onSort,
  expanded,
  onToggle,
}: {
  garageId: string
  rows: JobCardRecord[]
  sort: SortState
  onSort: (field: JobCardSortField) => void
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const chevron = (id: string) => (
    <ChevronDown
      className={cn(
        'h-4 w-4 shrink-0 text-slate-400 transition-transform',
        expanded.has(id) && 'rotate-180 text-slate-600',
      )}
    />
  )

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:block">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80">
                <th className="w-10" aria-label="Open" />
                {HEADERS.map((header) => {
                  const className = cn(
                    'whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600',
                    header.className,
                  )

                  if (!header.field) {
                    return (
                      <th key={header.label} className={className}>
                        {header.label}
                      </th>
                    )
                  }

                  // The active column shows the direction it is ordering by; the
                  // rest show a faint double arrow, so it reads as "clickable" —
                  // the same three states the garage list's headers use.
                  const active = header.field === sort.field
                  const ascending = active && sort.order === 'asc'

                  return (
                    <th
                      key={header.label}
                      className={className}
                      aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}
                    >
                      <button
                        type="button"
                        onClick={() => onSort(header.field as JobCardSortField)}
                        title={`Sort by ${header.label} (${ascending ? 'descending' : 'ascending'})`}
                        className={cn(
                          'group inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-slate-900',
                          active && 'text-slate-900',
                        )}
                      >
                        {header.label}
                        {active ? (
                          ascending ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60 transition-opacity group-hover:opacity-100" />
                        )}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((card) => {
                const open = expanded.has(card.id)
                const vehicle = card.vehicle
                const customer = vehicle?.customer

                return (
                  <Fragment key={card.id}>
                    <tr
                      onClick={() => onToggle(card.id)}
                      aria-expanded={open}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-slate-50',
                        open && 'bg-slate-50',
                      )}
                    >
                      <td className="pl-4">{chevron(card.id)}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{card.jobNumber}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        {formatServiceDate(card.serviceDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="truncate font-medium text-slate-900">
                          {customer?.fullName || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {customer?.mobileNumber || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="truncate font-mono text-xs text-slate-900">
                          {vehicle?.vehicleNumber || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {vehicle ? vehicleDisplayName(vehicle) : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={jobCardStatusTone(card.status)}>
                          {jobCardStatusLabel(card.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={paymentStatusTone(card.paymentStatus)}>
                          {paymentStatusLabel(card.paymentStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatMoney(card.totalAmount)}
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50">
                        <td colSpan={HEADERS.length + 1} className="px-4 pb-4 pt-1">
                          <JobCardDetail garageId={garageId} row={card} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((card) => {
          const open = expanded.has(card.id)
          const vehicle = card.vehicle
          const customer = vehicle?.customer

          return (
            <div
              key={card.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
            >
              <button
                type="button"
                onClick={() => onToggle(card.id)}
                aria-expanded={open}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{card.jobNumber}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatServiceDate(card.serviceDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={jobCardStatusTone(card.status)}>
                      {jobCardStatusLabel(card.status)}
                    </Badge>
                    {chevron(card.id)}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p className="flex min-w-0 items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{customer?.fullName || '—'}</span>
                    {customer?.mobileNumber && (
                      <span className="shrink-0 text-slate-400">· {customer.mobileNumber}</span>
                    )}
                  </p>
                  <p className="flex min-w-0 items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="shrink-0 font-mono text-xs">
                      {vehicle?.vehicleNumber || '—'}
                    </span>
                    {vehicle && (
                      <span className="truncate text-slate-400">{vehicleDisplayName(vehicle)}</span>
                    )}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <Badge tone={paymentStatusTone(card.paymentStatus)}>
                    {paymentStatusLabel(card.paymentStatus)}
                  </Badge>
                  <span className="flex items-center gap-0.5 text-base font-bold tabular-nums text-slate-900">
                    <IndianRupee className="h-4 w-4 text-slate-400" />
                    {formatAmount(card.totalAmount)}
                  </span>
                </div>
              </button>

              {open && (
                <div className="border-t border-slate-200 bg-slate-50 p-3">
                  <JobCardDetail garageId={garageId} row={card} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

/**
 * Every job card of one garage with its payment standing — the window the
 * admin garage list opens.
 *
 * It holds the garage's whole book at once rather than a page of it: the
 * figures above the list then describe the garage rather than the rows on
 * screen, and searching, filtering and sorting answer as they are typed
 * instead of costing a request each.
 *
 * A window of its own, outside the admin shell: it is opened beside the garage
 * list rather than in place of it, and a second sidebar in a second window is
 * only something to close.
 */
export function AdminGarageJobCards() {
  const { garageId = '' } = useParams()
  const [params] = useSearchParams()

  // The garage's details are handed over in the address so the header reads
  // the moment the window opens — a new window carries no router state. The
  // API returns the garage beside the cards, and that is what the header ends
  // up showing: a bookmarked address with nothing on it still titles itself,
  // and a garage renamed since the list was loaded reads correctly.
  const [garage, setGarage] = useState<GarageIdentity | null>(null)
  const garageName = garage?.garageName || params.get('garage') || 'Garage'
  const ownerName = garage?.ownerName || params.get('owner') || ''
  const mobileNumber = garage?.mobileNumber || params.get('mobile') || ''
  const city = garage?.city || params.get('city') || ''

  const [cards, setCards] = useState<JobCardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [payment, setPayment] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // Only the newest load may write to state, so a slow first request cannot
  // overwrite the results of a refresh fired after it.
  const latestRequest = useRef(0)

  const load = useCallback(async () => {
    if (!garageId) return

    const requestId = ++latestRequest.current
    setLoading(true)
    setError(null)

    try {
      const loaded = await fetchAllJobCards(garageId)
      if (requestId !== latestRequest.current) return
      setGarage(loaded.garage)
      setCards(loaded.cards)
    } catch (cause) {
      if (requestId !== latestRequest.current) return
      setError(
        cause instanceof ApiError ? cause.message : 'Could not load this garage’s job cards.',
      )
      setCards([])
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [garageId])

  useEffect(() => {
    void load()
  }, [load])

  // The window is opened beside the garage list, so its tab has to say which
  // garage it is for without being read.
  useEffect(() => {
    document.title = `Job Cards · ${garageName}`
  }, [garageName])

  /** The summary counts every card, not what the filters have narrowed to. */
  const summary = useMemo(() => summariseJobCards(cards), [cards])

  const filtered = useMemo(() => {
    const matched = cards.filter(
      (card) =>
        (payment === 'all' || card.paymentStatus === payment) &&
        (status === 'all' || card.status === status) &&
        matchesJobCardSearch(card, query),
    )
    return sortJobCards(matched, sort.field, sort.order)
  }, [cards, payment, status, query, sort])

  // Narrowing the list makes page 4 of the old result set meaningless.
  const filterKey = `${query}|${payment}|${status}|${limit}|${sort.field}:${sort.order}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * limit, currentPage * limit)

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  /** A new column starts ascending; the one already sorting flips. */
  const handleSort = (field: JobCardSortField) =>
    setSort((current) =>
      current.field === field
        ? { ...current, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field, order: 'asc' },
    )

  const narrowed = Boolean(query.trim()) || payment !== 'all' || status !== 'all'

  /**
   * Downloads what the list is showing — and because this window holds the
   * garage's whole book rather than a page of it, that is every card the
   * search and the chips match, not just the rows on screen.
   */
  const exportExcel = () =>
    downloadExcel(
      datedFileName(`job-cards-${garageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
      {
        title: 'Job Card List',
        subtitle: `${garageName}${ownerName ? ` — ${ownerName}` : ''}`,
        sheetName: 'Job Cards',
        includeIndex: true,
        // What the sheet is a snapshot of, so a saved file explains itself.
        meta: [
          { label: 'Search', value: query.trim() || 'All job cards' },
          {
            label: 'Payment',
            value: PAYMENT_FILTERS.find((f) => f.value === payment)?.label ?? payment,
          },
          { label: 'Status', value: STATUS_FILTERS.find((f) => f.value === status)?.label ?? status },
          {
            label: 'Sorted By',
            value: `${SORT_FIELDS.find((f) => f.key === sort.field)?.label ?? sort.field} (${
              sort.order === 'asc' ? 'ascending' : 'descending'
            })`,
          },
        ],
      },
      JOB_CARD_EXPORT_COLUMNS,
      filtered,
    )

  const headerMeta = (
    [
      ownerName && { icon: User, text: ownerName },
      mobileNumber && { icon: Phone, text: mobileNumber },
      city && { icon: MapPin, text: city },
    ] as ({ icon: LucideIcon; text: string } | '')[]
  ).filter(Boolean) as { icon: LucideIcon; text: string }[]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* The garage this window is about, kept at the top through the scroll
          so a long book never loses the name it belongs to. */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg print:static print:bg-white print:shadow-none">
        <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:items-start sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white sm:h-11 sm:w-11 print:bg-slate-100 print:text-slate-700">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              {/* The eyebrow is what the browser tab already says, so on a
                  phone it gives its line back to the list below. */}
              <p className="hidden text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                Job Cards &amp; Payments
              </p>
              <h1 className="truncate text-base font-bold text-white sm:text-lg md:text-xl print:text-slate-900">
                {garageName}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-300 sm:mt-1 sm:gap-x-4 sm:gap-y-1 sm:text-sm print:text-slate-600">
                {headerMeta.map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> {text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 sm:h-9 sm:flex-none sm:gap-2 sm:px-3 sm:text-sm"
            >
              <RefreshCw className={cn('h-4 w-4 shrink-0', loading && 'animate-spin')} /> Refresh
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={loading || filtered.length === 0}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 sm:h-9 sm:flex-none sm:gap-2 sm:px-3 sm:text-sm"
            >
              <Download className="h-4 w-4 shrink-0" /> Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-100 sm:h-9 sm:flex-none sm:gap-2 sm:px-3 sm:text-sm"
            >
              <Printer className="h-4 w-4 shrink-0" /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            title="Could not load job cards"
            description={error}
            onRetry={() => void load()}
          />
        ) : (
          <div className="space-y-4">
            <SummaryTiles summary={summary} />

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card print:hidden sm:p-4">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search job number, customer, mobile, vehicle or item..."
              />
              <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
                <FilterButton options={PAYMENT_FILTERS} value={payment} onChange={setPayment} />
                <FilterButton options={STATUS_FILTERS} value={status} onChange={setStatus} />
              </div>

              {/* The table sorts from its headers; the cards get the same
                  fields here, with the same arrows. */}
              <SortBar
                className="mt-3 border-t border-slate-100 pt-3 lg:hidden"
                fields={SORT_FIELDS}
                sortBy={sort.field}
                sortOrder={sort.order}
                onSort={(key) => handleSort(key as JobCardSortField)}
              />
            </div>

            {cards.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No job cards yet"
                description="This garage has not opened a single job card."
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No job cards match"
                description="Try a different search, or clear the filters."
              />
            ) : (
              <>
                <JobCardList
                  garageId={garageId}
                  rows={visible}
                  sort={sort}
                  onSort={handleSort}
                  expanded={expanded}
                  onToggle={toggle}
                />

                <div className="print:hidden">
                  <PaginationBar
                    pagination={{
                      page: currentPage,
                      limit,
                      total: filtered.length,
                      totalPages,
                      hasNextPage: currentPage < totalPages,
                      hasPreviousPage: currentPage > 1,
                    }}
                    count={visible.length}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                  />
                </div>

                {narrowed && (
                  <p className="text-xs text-slate-500 print:hidden">
                    Showing {filtered.length} of {cards.length} job cards — the figures above always
                    count every card in the garage.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
