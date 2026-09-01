import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Wrench } from 'lucide-react'
import {
  DEFAULT_PAGE_SIZE,
  PageHeader,
  PaginationBar,
  ResponsiveList,
  SearchInput,
  SortBar,
} from '@/components/common'
import type { Column, SortBarField, SortOrder } from '@/components/common'
import { Badge, Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { jobCardService } from '@/services/jobCardService'
import { ApiError } from '@/services/httpClient'
import {
  formatServiceDate,
  jobCardStatusLabel,
  jobCardStatusTone,
  vehicleDisplayName,
} from '@/lib/jobCard'
import { formatCurrency } from '@/lib/utils'
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

/** The vehicle and its owner, as every row and card needs them. */
function vehicleLine(job: JobCardRecord): string {
  const vehicle = job.vehicle
  if (!vehicle) return '—'
  const name = vehicleDisplayName(vehicle)
  return name ? `${name} · ${vehicle.vehicleNumber}` : vehicle.vehicleNumber
}

/** What was billed, in the desk's words — the line descriptions. */
function itemsLine(job: JobCardRecord): string {
  return job.items?.map((item) => item.description).join(', ') || 'Nothing billed yet'
}

export function JobCards() {
  const navigate = useNavigate()

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
    {
      header: 'Job No.',
      sortKey: 'jobNumber',
      accessor: (job) => <span className="font-semibold text-slate-900">{job.jobNumber}</span>,
    },
    {
      header: 'Service Date',
      sortKey: 'serviceDate',
      accessor: (job) => formatServiceDate(job.serviceDate),
    },
    { header: 'Vehicle', accessor: (job) => vehicleLine(job) },
    { header: 'Customer', accessor: (job) => job.vehicle?.customer?.fullName ?? '—' },
    {
      header: 'Amount',
      sortKey: 'totalAmount',
      accessor: (job) => <span className="font-medium">{formatCurrency(job.totalAmount)}</span>,
    },
    {
      header: 'Status',
      sortKey: 'status',
      accessor: (job) => (
        <Badge tone={jobCardStatusTone(job.status)}>{jobCardStatusLabel(job.status)}</Badge>
      ),
    },
    {
      header: '',
      className: 'text-right',
      accessor: (job) => (
        <span className="text-sm font-medium text-primary-600">
          {isPending(job) ? 'Edit' : 'View'}
        </span>
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
            onRowClick={openJob}
            renderCard={(job) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-slate-900">{job.jobNumber}</span>
                    <span className="block text-xs text-slate-500">
                      {formatServiceDate(job.serviceDate)}
                    </span>
                  </div>
                  <Badge tone={jobCardStatusTone(job.status)}>
                    {jobCardStatusLabel(job.status)}
                  </Badge>
                </div>

                <p className="mt-2 truncate font-medium text-slate-800">
                  {job.vehicle ? vehicleDisplayName(job.vehicle) : '—'}
                </p>
                <p className="font-mono text-sm text-slate-500">{job.vehicle?.vehicleNumber}</p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {job.vehicle?.customer?.fullName ?? '—'}
                </p>
                <p className="mt-2 truncate text-sm text-slate-500">{itemsLine(job)}</p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-base font-semibold text-slate-900">
                    {formatCurrency(job.totalAmount)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={
                      isPending(job) ? (
                        <Pencil className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )
                    }
                    onClick={() => openJob(job)}
                  >
                    {isPending(job) ? 'Edit' : 'View'}
                  </Button>
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
