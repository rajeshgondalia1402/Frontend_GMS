import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Eye, FileText, IndianRupee, Minus, Pencil, Plus, Wrench } from 'lucide-react'
import {
  ActionButton,
  DEFAULT_PAGE_SIZE,
  PageHeader,
  PaginationBar,
  ResponsiveList,
  SearchInput,
  SortBar,
} from '@/components/common'
import type { Column, SortBarField, SortOrder } from '@/components/common'
import { Badge, Button, EmptyState, ErrorState, LoadingState, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getJobCard, jobCardService } from '@/services/jobCardService'
import { paymentService } from '@/services/paymentService'
import { ApiError } from '@/services/httpClient'
import {
  JOB_CARD_EXPORT_COLUMNS,
  formatMoney,
  formatServiceDate,
  jobCardStatusLabel,
  jobCardStatusTone,
  vehicleDisplayName,
} from '@/lib/jobCard'
import { paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import { datedFileName, downloadExcel } from '@/lib/excel'
import { downloadInvoice } from '@/lib/invoice'
import { cn } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { JobCardListParams, JobCardRecord } from '@/types/jobCard'

/** Only these are sortable — the API rejects any other `sortBy`. */
type SortField = NonNullable<JobCardListParams['sortBy']>

interface SortState {
  field: SortField
  order: SortOrder
}

/**
 * Every field a header offers is one the API sorts by, so the whole list is
 * ordered rather than just the page that happens to be on screen.
 */
const DEFAULT_SORT: SortState = { field: 'createdAt', order: 'desc' }

const sortValue = (sort: SortState) => `${sort.field}:${sort.order}`

/** The same fields the sortable table headers offer, for the card list. */
const SORT_FIELDS: SortBarField[] = [
  { key: 'jobNumber', label: 'Job No.' },
  { key: 'serviceDate', label: 'Service Date' },
  { key: 'totalAmount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
]

/** What the current order is called, for the exported sheet's header. */
const sortLabel = (sort: SortState) =>
  `${SORT_FIELDS.find((f) => f.key === sort.field)?.label ?? sort.field} (${
    sort.order === 'asc' ? 'ascending' : 'descending'
  })`

/**
 * Each action keeps one width down the whole table, so the three buttons
 * line up under one another however long the words in them are.
 */
const ACTION_WIDTH = {
  invoice: 'w-[4.25rem]',
  money: 'w-[4.75rem]',
  open: 'w-[3.5rem]',
}

/**
 * Who the card is for, opened from the `+` at the start of its row.
 *
 * A make and model, a registration, a name and a mobile number are four
 * long values, and columns wide enough for all four leave the table with
 * nothing for the money and the buttons. They are read here instead, on the
 * row that needs them rather than on every row at once.
 */
function JobCardParties({ job }: { job: JobCardRecord }) {
  const vehicle = job.vehicle
  const customer = vehicle?.customer

  const fields = [
    { label: 'Vehicle', value: vehicle ? vehicleDisplayName(vehicle) : '' },
    { label: 'Vehicle Number', value: vehicle?.vehicleNumber },
    { label: 'Customer Name', value: customer?.fullName },
    { label: 'Mobile Number', value: customer?.mobileNumber },
  ]

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4">
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {field.label}
          </p>
          <p className="mt-0.5 break-words text-sm font-medium text-slate-900">
            {field.value?.trim() || '—'}
          </p>
        </div>
      ))}
    </div>
  )
}

/** What was billed, in the desk's words — the line descriptions. */
function itemsLine(job: JobCardRecord): string {
  return job.items?.map((item) => item.description).join(', ') || 'Nothing billed yet'
}

/**
 * A bill is only worth printing once money has been taken against it: an
 * unpaid card has nothing on it a customer would keep, and the invoice is
 * offered the moment the first receipt lands.
 */
function hasInvoice(job: JobCardRecord): boolean {
  return job.paymentStatus === 'PARTIAL' || job.paymentStatus === 'PAID'
}

export function JobCards() {
  const navigate = useNavigate()
  const { toast } = useToast()
  // The invoice is made out over the garage that is logged in.
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  const [jobCards, setJobCards] = useState<JobCardRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** The card whose invoice is being put together, if any. */
  const [invoicing, setInvoicing] = useState<string | null>(null)
  /** The rows opened to show who the card is for. */
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // Any change to what is being asked for starts from page one: page 4 of the
  // old result set says nothing about the new one.
  const queryKey = `${search}|${sortValue(sort)}|${limit}`
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
      const data = await jobCardService.listJobCards({
        page,
        limit,
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(search ? { search } : {}),
      })

      if (requestId !== latestRequest.current) return

      setJobCards(data.jobCards ?? [])
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load job cards.')
      setJobCards([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, sort, page, limit])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /**
   * A card still pending is work in hand, so it opens on the form to be
   * changed; anything past that opens read only. The row is handed over so
   * either screen paints before its own request comes back.
   */
  const isPending = (job: JobCardRecord) => job.status === 'PENDING'

  const openJob = (job: JobCardRecord) =>
    navigate(isPending(job) ? `/app/job-cards/${job.id}/edit` : `/app/job-cards/${job.id}`, {
      state: { jobCard: job },
    })

  /**
   * Downloads the invoice for one card.
   *
   * The row on this screen carries the card without its lines and knows
   * nothing of the receipts, so both are fetched first: an invoice that left
   * out what was billed, or what has already been paid, would be worse than
   * no invoice at all. The row stands in for a card the API will not hand
   * back, which still prints everything the list itself holds.
   */
  const downloadJobInvoice = async (job: JobCardRecord) => {
    setInvoicing(job.id)

    try {
      const [card, money] = await Promise.all([
        getJobCard(job.id).catch(() => job),
        paymentService.getJobCardPayments(job.id),
      ])

      downloadInvoice({
        garage: {
          name: user?.garageName,
          ownerName: user?.ownerName,
          mobile: user?.mobileNumber,
          email: user?.email,
          city: user?.city,
        },
        jobCard: card,
        money: money.jobCard,
        payments: money.payments ?? [],
      })
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Could not build the invoice.',
        'error',
      )
    } finally {
      setInvoicing(null)
    }
  }

  /** Collecting the money is its own screen, whatever state the card is in. */
  const openPayment = (job: JobCardRecord) =>
    navigate(`/app/job-cards/${job.id}/payment`, { state: { jobCard: job } })

  /**
   * Downloads exactly what the list is showing — this page of it, under the
   * search term in the box. Asking for "All" rows first is what downloads
   * every card.
   *
   * One row per card, with its billable lines folded into a cell: this is the
   * job card register, not the itemised bill. A single card's bill is the
   * Invoice button on its own row.
   */
  const exportExcel = () =>
    downloadExcel(
      datedFileName('job-cards'),
      {
        title: 'Job Card List',
        subtitle: user?.garageName ?? 'Garage Management System',
        sheetName: 'Job Cards',
        includeIndex: true,
        // What the sheet is a snapshot of, so a saved file explains itself.
        meta: [
          { label: 'Search', value: search || 'All job cards' },
          { label: 'Sorted By', value: sortLabel(sort) },
        ],
      },
      JOB_CARD_EXPORT_COLUMNS,
      jobCards,
    )

  const toggleParties = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const isExpanded = (job: JobCardRecord) => expanded.has(job.id)

  /** A card with no vehicle on it has nothing to open, and keeps the cell blank. */
  const expandToggle = (job: JobCardRecord) => {
    if (!job.vehicle) return null

    const open = isExpanded(job)
    return (
      <button
        type="button"
        onClick={() => toggleParties(job.id)}
        aria-expanded={open}
        aria-label={`${open ? "Hide" : "Show"} the vehicle and customer of ${job.jobNumber}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
      >
        {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </button>
    )
  }

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

  const columns: Column<JobCardRecord>[] = [
    { header: '', className: 'w-10 pr-0', accessor: expandToggle },
    {
      header: 'Job No.',
      sortKey: 'jobNumber',
      // Wide enough for the whole of `JC-2026-0004`: an identifier that is
      // cut short is worse than useless, so this column never truncates.
      className: 'w-[9rem]',
      accessor: (job) => <span className="font-semibold text-slate-900">{job.jobNumber}</span>,
    },
    {
      header: 'Service Date',
      sortKey: 'serviceDate',
      // The narrowest desktop still cannot hold every column. The date and
      // the job status are the two the desk needs least at a glance, so they
      // are the ones that wait for a wider screen.
      className: 'hidden w-[8rem] xl:table-cell',
      accessor: (job) => formatServiceDate(job.serviceDate),
    },
    {
      header: 'Amount',
      sortKey: 'totalAmount',
      // Money is read down the column, so it is set against the right edge
      // with the paise always written out and every digit on one width.
      align: 'right',
      className: 'w-[7.5rem]',
      accessor: (job) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatMoney(job.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Status',
      sortKey: 'status',
      className: 'hidden w-[7rem] xl:table-cell',
      accessor: (job) => (
        <Badge tone={jobCardStatusTone(job.status)}>{jobCardStatusLabel(job.status)}</Badge>
      ),
    },
    {
      header: 'Payment',
      className: 'w-[8rem]',
      accessor: (job) => (
        <Badge tone={paymentStatusTone(job.paymentStatus)}>
          {paymentStatusLabel(job.paymentStatus)}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      className: 'w-[14.5rem]',
      accessor: (job) => (
        <div className="flex items-center justify-end gap-1.5">
          {hasInvoice(job) ? (
            <ActionButton
              tone="primary"
              title="Download the invoice as a PDF"
              loading={invoicing === job.id}
              onClick={() => void downloadJobInvoice(job)}
              className={ACTION_WIDTH.invoice}
            >
              {invoicing === job.id ? null : 'Invoice'}
            </ActionButton>
          ) : (
            // An unpaid card has no invoice to give, and the gap left in its
            // place keeps the other two under one another down the table.
            <span className={cn('shrink-0', ACTION_WIDTH.invoice)} aria-hidden="true" />
          )}
          <ActionButton
            tone="money"
            title={job.paymentStatus === 'PAID' ? 'See the receipts' : 'Collect the payment'}
            onClick={() => openPayment(job)}
            className={ACTION_WIDTH.money}
          >
            {job.paymentStatus === 'PAID' ? 'Receipts' : 'Collect'}
          </ActionButton>
          <ActionButton
            title={isPending(job) ? 'Edit this job card' : 'Open this job card'}
            onClick={() => openJob(job)}
            className={ACTION_WIDTH.open}
          >
            {isPending(job) ? 'Edit' : 'View'}
          </ActionButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Job Cards"
        subtitle="Track service jobs"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/job-cards/new')}>
            <span className="hidden sm:inline">New Job Card</span>
            <span className="sm:hidden">New</span>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search customer, vehicle number or type..."
          className="sm:flex-1"
        />
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={jobCards.length === 0}
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
          title="Could not load job cards"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : jobCards.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No job cards found"
          description={search ? 'Try a different search.' : 'Create your first job card.'}
          action={
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/app/job-cards/new')}
            >
              New Job Card
            </Button>
          }
        />
      ) : (
        <>
          <ResponsiveList
            data={jobCards}
            columns={columns}
            keyField={(job) => job.id}
            sortBy={sort.field}
            sortOrder={sort.order}
            onSort={handleSort}
            isExpanded={isExpanded}
            renderExpanded={(job) => <JobCardParties job={job} />}
            fitWidth
            renderCard={(job) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  {/* The same `+` the table row carries, opening the same
                      four fields under the card. */}
                  <div className="flex min-w-0 items-start gap-3">
                    {expandToggle(job)}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900">{job.jobNumber}</span>
                      <span className="block text-xs text-slate-500">
                        {formatServiceDate(job.serviceDate)}
                      </span>
                    </div>
                  </div>
                  <Badge tone={jobCardStatusTone(job.status)}>
                    {jobCardStatusLabel(job.status)}
                  </Badge>
                </div>

                <p className="mt-2 truncate text-sm text-slate-500">{itemsLine(job)}</p>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold tabular-nums text-slate-900">
                      {formatMoney(job.totalAmount)}
                    </span>
                    <Badge tone={paymentStatusTone(job.paymentStatus)}>
                      {paymentStatusLabel(job.paymentStatus)}
                    </Badge>
                  </div>

                  {/* Invoice + Receipts + View want 289px and a 320px phone's
                      card gives the row 254. `flex-1` alone cannot shrink them
                      — a flex item will not go below its content unless it is
                      told it may — so each is given a floor it may shrink to
                      and the row wraps once even that will not fit. */}
                  <div className="mt-3 flex flex-wrap items-stretch gap-2">
                    {hasInvoice(job) && (
                      <ActionButton
                        layout="card"
                        tone="primary"
                        className="min-w-[5.5rem]"
                        loading={invoicing === job.id}
                        icon={<FileText className="h-4 w-4" />}
                        onClick={() => void downloadJobInvoice(job)}
                      >
                        Invoice
                      </ActionButton>
                    )}
                    <ActionButton
                      layout="card"
                      tone="money"
                      className="min-w-[5.5rem]"
                      icon={<IndianRupee className="h-4 w-4" />}
                      onClick={() => openPayment(job)}
                    >
                      {job.paymentStatus === 'PAID' ? 'Receipts' : 'Collect'}
                    </ActionButton>
                    <ActionButton
                      layout="card"
                      className="min-w-[5.5rem]"
                      icon={
                        isPending(job) ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )
                      }
                      onClick={() => openJob(job)}
                    >
                      {isPending(job) ? 'Edit' : 'View'}
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}
          />

          {pagination && (
            <PaginationBar
              pagination={pagination}
              count={jobCards.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}
    </div>
  )
}
