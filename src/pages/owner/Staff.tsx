import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Pencil, Phone, Plus, PowerOff, Tag, UsersRound } from 'lucide-react'
import { DEFAULT_PAGE_SIZE, FilterCard, PageHeader, PaginationBar, SearchInput } from '@/components/common'
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, useToast } from '@/components/ui'
import { StaffFormModal } from '@/components/staff'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCount } from '@/lib/dashboard'
import { staffService } from '@/services/staffService'
import { ApiError } from '@/services/httpClient'
import { staffCategoryLabel, staffSalaryLabel, staffStatusLabel, staffStatusTone } from '@/lib/staff'
import { cn, getInitial } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { StaffListParams, StaffRecord, StaffStatus } from '@/types/staff'

/**
 * The order is not offered on screen, so the list is always read newest
 * first — the API sorts the whole of it, not just the page shown.
 */
const LIST_ORDER: Pick<StaffListParams, 'sortBy' | 'sortOrder'> = {
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

type StatusFilter = 'all' | StaffStatus

interface StaffCounts {
  all: number
  active: number
  inactive: number
}

/** Active / inactive as a switch, the same control the plans page uses. */
function StatusSwitch({
  member,
  busy,
  onToggle,
}: {
  member: StaffRecord
  busy: boolean
  onToggle: () => void
}) {
  const active = member.status === 'ACTIVE'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${member.name} is ${active ? 'active' : 'inactive'}`}
      title={active ? 'Deactivate: no longer working at the garage' : 'Activate: working at the garage again'}
      disabled={busy}
      onClick={onToggle}
      className={cn(
        'group inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          active ? 'bg-emerald-500' : 'bg-slate-300',
          busy && 'animate-pulse',
        )}
      >
        <span
          className={cn(
            'inline-flex h-5 w-5 rounded-full bg-white shadow transition-transform',
            active ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
      {active ? 'Active' : 'Inactive'}
    </button>
  )
}

function StaffCard({
  member,
  busy,
  onEdit,
  onToggle,
}: {
  member: StaffRecord
  busy: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  const active = member.status === 'ACTIVE'
  const salary = staffSalaryLabel(member.monthlySalary)

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-white p-4 shadow-card',
        active ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold',
              active ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-500',
            )}
          >
            {getInitial(member.name)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">{member.name}</h3>
            <p className="truncate text-xs text-slate-500">{member.role || staffCategoryLabel(member.category)}</p>
          </div>
        </div>
        <Badge tone={staffStatusTone(member.status)}>{staffStatusLabel(member.status)}</Badge>
      </div>

      <div className="mt-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight text-slate-900">{salary}</span>
          {salary !== '—' && <span className="text-sm text-slate-500">/ month</span>}
        </p>
        <p className="mt-0.5 h-4 text-xs text-slate-400">{salary === '—' ? 'Salary not set yet' : ''}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Tag className="h-3 w-3" /> Category
          </dt>
          <dd className="mt-0.5 truncate font-semibold text-slate-800">{staffCategoryLabel(member.category)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Phone className="h-3 w-3" /> Mobile
          </dt>
          <dd className="mt-0.5 truncate font-semibold text-slate-800">
            <a href={`tel:${member.mobileNumber}`} className="hover:text-primary-700">
              {member.mobileNumber}
            </a>
          </dd>
        </div>
      </dl>

      {/* Pinned to the bottom, so cards of different heights line their actions up. */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <StatusSwitch member={member} busy={busy} onToggle={onToggle} />
          <Button size="sm" variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}

/** How many staff a filter holds — a one row page is enough to read the total. */
async function countStaff(search: string, status?: StaffStatus): Promise<number> {
  const data = await staffService.listStaff({
    page: 1,
    limit: 1,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  })
  return data.pagination?.total ?? data.staff?.length ?? 0
}

export function Staff() {
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  // One request per pause in typing, not one per keystroke.
  const search = useDebouncedValue(query.trim(), 350)

  const [status, setStatus] = useState<StatusFilter>('all')

  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [counts, setCounts] = useState<StaffCounts | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** The dialog is shared: a card here edits it, `null` adds someone new. */
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StaffRecord | null>(null)
  const [confirming, setConfirming] = useState<StaffRecord | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Only the newest request may write to state: a slow response for an earlier
  // search term must not overwrite the results of the one being typed now.
  const latestRequest = useRef(0)
  const latestCounts = useRef(0)

  // Any change to what is being asked for starts from page one: page 4 of the
  // old result set says nothing about the new one. Resetting during the render
  // that changes them keeps the stale page from being asked for at all.
  const queryKey = `${search}|${status}|${limit}`
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
        ...LIST_ORDER,
        ...(search ? { search } : {}),
        ...(status === 'all' ? {} : { status }),
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
  }, [search, status, page, limit])

  /**
   * The figures on the filter cards. The list endpoint returns no counts, so
   * each is the total of a one row page; they follow the search, not the
   * selected card, so every card always says what tapping it would show.
   */
  const fetchCounts = useCallback(async () => {
    const requestId = ++latestCounts.current
    try {
      const [all, active, inactive] = await Promise.all([
        countStaff(search),
        countStaff(search, 'ACTIVE'),
        countStaff(search, 'INACTIVE'),
      ])
      if (requestId === latestCounts.current) setCounts({ all, active, inactive })
    } catch {
      // The list shows the error; the cards simply keep a dash.
      if (requestId === latestCounts.current) setCounts(null)
    }
  }, [search])

  // Re-runs whenever the search term, a filter, the page or the page size
  // changes.
  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  useEffect(() => {
    void fetchCounts()
  }, [fetchCounts])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (member: StaffRecord) => {
    setEditing(member)
    setFormOpen(true)
  }

  const closeForm = () => setFormOpen(false)

  /**
   * A new staff member is `ACTIVE` and newest, so it belongs at the top of the
   * default order; an edited one may have moved out of the current filter. The
   * list is read again rather than patched, which also keeps the pagination
   * honest — a fresh add goes back to page one to be seen.
   */
  const handleSaved = () => {
    setFormOpen(false)
    if (!editing && page !== 1) setPage(1)
    else void fetchPage()
    void fetchCounts()
  }

  const changeStatus = async (member: StaffRecord, next: StaffStatus) => {
    setBusyId(member.id)
    try {
      await staffService.updateStaff(member.id, { status: next })
      toast(next === 'ACTIVE' ? `${member.name} is active again` : `${member.name} deactivated`, 'success')
      await Promise.all([fetchPage(), fetchCounts()])
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not change the staff status', 'error')
    } finally {
      setBusyId(null)
    }
  }

  // Switching off asks first; switching back on is harmless and happens at once.
  const toggle = (member: StaffRecord) =>
    member.status === 'ACTIVE' ? setConfirming(member) : void changeStatus(member, 'ACTIVE')

  /** True once anything narrows the list, which changes what "empty" means. */
  const narrowed = Boolean(search) || status !== 'all'

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage your team"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            <span className="hidden sm:inline">Add Staff</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterCard
          icon={UsersRound}
          label="All staff"
          tone="primary"
          value={counts ? formatCount(counts.all) : '—'}
          selected={status === 'all'}
          onClick={() => setStatus('all')}
        />
        <FilterCard
          icon={CheckCircle2}
          label="Active"
          hint="Working at the garage"
          tone="success"
          value={counts ? formatCount(counts.active) : '—'}
          selected={status === 'ACTIVE'}
          onClick={() => setStatus('ACTIVE')}
        />
        <FilterCard
          icon={PowerOff}
          label="Inactive"
          hint="No longer working here"
          tone="neutral"
          value={counts ? formatCount(counts.inactive) : '—'}
          selected={status === 'INACTIVE'}
          onClick={() => setStatus('INACTIVE')}
        />
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search name, role, category or mobile..."
        className="mb-4"
      />

      {loading && staff.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState title="Could not load staff" description={error} onRetry={() => void fetchPage()} />
      ) : staff.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={narrowed ? 'No staff match' : 'No staff yet'}
          description={narrowed ? 'Try a different search or filter.' : 'Add your first team member.'}
        />
      ) : (
        <>
          <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
            {staff.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                busy={busyId === member.id}
                onEdit={() => openEdit(member)}
                onToggle={() => toggle(member)}
              />
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

      <StaffFormModal open={formOpen} staff={editing} onClose={closeForm} onSaved={handleSaved} />

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void changeStatus(confirming, 'INACTIVE')
        }}
        title={confirming ? `Deactivate ${confirming.name}?` : 'Deactivate staff?'}
        message="They stay on your books, marked as no longer working here. You can activate them again at any time."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  )
}
