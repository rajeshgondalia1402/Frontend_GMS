import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Phone, Plus, UsersRound } from 'lucide-react'
import {
  DEFAULT_PAGE_SIZE,
  FilterButton,
  PageHeader,
  PaginationBar,
  SearchInput,
} from '@/components/common'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Select,
  useToast,
} from '@/components/ui'
import { AddStaffModal } from '@/components/staff'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { staffService } from '@/services/staffService'
import { ApiError } from '@/services/httpClient'
import {
  STAFF_CATEGORY_FILTERS,
  STAFF_STATUS_OPTIONS,
  staffCategoryLabel,
  staffSalaryLabel,
  staffStatusLabel,
  staffStatusTone,
} from '@/lib/staff'
import { getInitial } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { StaffCategory, StaffListParams, StaffRecord, StaffStatus } from '@/types/staff'

type SortKey = 'newest' | 'name-asc' | 'name-desc' | 'salary-desc' | 'salary-asc'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'salary-desc', label: 'Salary (high–low)' },
  { value: 'salary-asc', label: 'Salary (low–high)' },
]

/**
 * Every order the picker offers is one the API sorts by, so the whole list is
 * ordered rather than just the page that happens to be on screen.
 */
const SORT_QUERY: Record<SortKey, Pick<StaffListParams, 'sortBy' | 'sortOrder'>> = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  'name-asc': { sortBy: 'name', sortOrder: 'asc' },
  'name-desc': { sortBy: 'name', sortOrder: 'desc' },
  'salary-desc': { sortBy: 'monthlySalary', sortOrder: 'desc' },
  'salary-asc': { sortBy: 'monthlySalary', sortOrder: 'asc' },
}

export function Staff() {
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)

  // Any change to what is being asked for starts from page one: page 4 of the
  // old result set says nothing about the new one. Resetting during the render
  // that changes them keeps the stale page from being asked for at all.
  const queryKey = `${search}|${category}|${status}|${sort}|${limit}`
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
      // One endpoint for all of it: each filter is simply left off to widen the
      // list, and no `status` is how the API returns active and inactive alike.
      const data = await staffService.listStaff({
        page,
        limit,
        ...SORT_QUERY[sort],
        ...(search ? { search } : {}),
        ...(category === 'all' ? {} : { category: category as StaffCategory }),
        ...(status === 'all' ? {} : { status: status as StaffStatus }),
      })

      if (requestId !== latestRequest.current) return

      setStaff(data.staff ?? [])
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return

      setError(err instanceof ApiError ? err.message : 'Could not load staff.')
      setStaff([])
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, category, status, sort, page, limit])

  // Re-runs whenever the search term, a filter, the order, the page or the
  // page size changes.
  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  /**
   * A new staff member is `ACTIVE` and newest, so it belongs at the top of the
   * default order — the list is read again rather than patched, which also
   * keeps the pagination honest.
   */
  const handleCreated = () => {
    setAddOpen(false)
    if (page !== 1) setPage(1)
    else void fetchPage()
  }

  /** True once anything narrows the list, which changes what "empty" means. */
  const narrowed = Boolean(search) || category !== 'all' || status !== 'all'

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage your team"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            <span className="hidden sm:inline">Add Staff</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4">
        <FilterButton options={STAFF_CATEGORY_FILTERS} value={category} onChange={setCategory} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, role, category or mobile..."
          className="sm:flex-1"
        />
        <div className="sm:w-48">
          <Select
            aria-label="Filter by status"
            options={STAFF_STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        <div className="sm:w-52">
          <Select
            aria-label="Sort staff"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Could not load staff"
          description={error}
          onRetry={() => void fetchPage()}
        />
      ) : staff.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No staff found"
          description={
            narrowed ? 'Try a different search or filter.' : 'Add your first team member.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-700">
                      {getInitial(s.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{s.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {s.role || staffCategoryLabel(s.category)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={staffStatusTone(s.status)}>{staffStatusLabel(s.status)}</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <Badge tone="neutral">{staffCategoryLabel(s.category)}</Badge>
                  <p className="text-sm font-semibold text-slate-900">
                    {staffSalaryLabel(s.monthlySalary)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5" /> {s.mobileNumber}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Eye className="h-4 w-4" />}
                    onClick={() => toast('Opening profile...', 'info')}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pagination && (
            <PaginationBar
              pagination={pagination}
              count={staff.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}

      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
    </div>
  )
}
