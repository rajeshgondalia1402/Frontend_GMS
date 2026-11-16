import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, IndianRupee, Plus, ReceiptText, Users, Wallet, X } from 'lucide-react'
import {
  ActionButton,
  DEFAULT_PAGE_SIZE,
  PageHeader,
  PaginationBar,
  ResponsiveList,
  SearchInput,
  StatCard,
} from '@/components/common'
import type { Column } from '@/components/common'
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Input, LoadingState, WhatsappIcon, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { SalaryFormModal } from '@/components/salary'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { salaryService } from '@/services/salaryService'
import { ApiError } from '@/services/httpClient'
import { currentMonthRange, formatSalaryDay, formatSalaryMonth, salaryModeLabel, salarySlipLink } from '@/lib/salary'
import { openWhatsapp } from '@/lib/whatsapp'
import { cn, formatCurrency, getInitial } from '@/lib/utils'
import type { Pagination } from '@/types/auth'
import type { SalaryFilters, SalaryRecord, SalarySummary } from '@/types/salary'

/** What the header says the report covers. */
function periodLabel(filters: SalaryFilters | null, fromDate: string, toDate: string): string {
  const from = filters?.fromDate ?? (fromDate || null)
  const to = filters?.toDate ?? (toDate || null)
  const month = currentMonthRange()
  if (from === month.fromDate && to === month.toDate) {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }
  if (from && to) return `${formatSalaryDay(from)} to ${formatSalaryDay(to)}`
  if (from) return `From ${formatSalaryDay(from)}`
  if (to) return `Up to ${formatSalaryDay(to)}`
  return 'All dates'
}

export function Salary() {
  const { toast } = useToast()

  // The report opens on the current month — the dates are filled in so the
  // pickers show exactly what is being counted.
  // The slip goes out over the garage's name.
  const { user } = useAuth()
  const [initialRange] = useState(currentMonthRange)
  const [fromDate, setFromDate] = useState(initialRange.fromDate)
  const [toDate, setToDate] = useState(initialRange.toDate)
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 350)

  const [rows, setRows] = useState<SalaryRecord[]>([])
  const [summary, setSummary] = useState<SalarySummary | null>(null)
  const [filters, setFilters] = useState<SalaryFilters | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryRecord | null>(null)
  const [deleting, setDeleting] = useState<SalaryRecord | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const rangeError = fromDate && toDate && fromDate > toDate ? 'To date is before the from date.' : ''

  const latestRequest = useRef(0)

  // A new filter starts from page one.
  const queryKey = `${search}|${fromDate}|${toDate}|${limit}`
  const [lastQueryKey, setLastQueryKey] = useState(queryKey)
  if (lastQueryKey !== queryKey) {
    setLastQueryKey(queryKey)
    setPage(1)
  }

  const fetchPage = useCallback(async () => {
    if (rangeError) return
    const requestId = ++latestRequest.current
    setLoading(true)
    setError(null)
    try {
      const data = await salaryService.listSalaries({
        page,
        limit,
        sortBy: 'paymentDate',
        sortOrder: 'desc',
        ...(search ? { search } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      })
      if (requestId !== latestRequest.current) return
      setRows(data.salaries ?? [])
      setSummary(data.summary ?? null)
      setFilters(data.filters ?? null)
      setPagination(data.pagination ?? null)
    } catch (err) {
      if (requestId !== latestRequest.current) return
      setError(err instanceof ApiError ? err.message : 'Could not load salary records.')
      setRows([])
      setSummary(null)
      setPagination(null)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [page, limit, search, fromDate, toDate, rangeError])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: SalaryRecord) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleSaved = () => {
    setFormOpen(false)
    void fetchPage()
  }

  const confirmDelete = async (record: SalaryRecord) => {
    setBusyId(record.id)
    try {
      await salaryService.deleteSalary(record.id)
      toast('Salary record deleted', 'success')
      // The last row of a page going leaves the page empty: step back one.
      if (rows.length === 1 && page > 1) setPage(page - 1)
      else await fetchPage()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not delete the salary record', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const isDefaultRange = fromDate === initialRange.fromDate && toDate === initialRange.toDate
  const narrowed = Boolean(search) || !isDefaultRange

  const clearFilters = () => {
    setQuery('')
    setFromDate(initialRange.fromDate)
    setToDate(initialRange.toDate)
  }

  const staffCell = (r: SalaryRecord) => (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
        {getInitial(r.staff.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">
          {r.staff.name}
          {r.staff.isDelete && <span className="ml-1.5 text-xs font-normal text-slate-400">(removed)</span>}
        </p>
        <p className="truncate text-xs text-slate-500">{r.staff.role || r.staff.mobileNumber}</p>
      </div>
    </div>
  )

  const columns: Column<SalaryRecord>[] = [
    { header: 'Staff', accessor: staffCell },
    {
      header: 'Salary Month',
      accessor: (r) => <span className="whitespace-nowrap text-slate-800">{formatSalaryMonth(r.salaryMonth)}</span>,
    },
    {
      header: 'Paid On',
      accessor: (r) => <span className="whitespace-nowrap text-slate-700">{formatSalaryDay(r.paymentDate)}</span>,
    },
    { header: 'Mode', accessor: (r) => <Badge tone="neutral">{salaryModeLabel(r.paymentMode)}</Badge> },
    {
      header: 'Remarks',
      className: 'max-w-[12rem]',
      accessor: (r) => <span className="block truncate text-slate-600">{r.remarks || '—'}</span>,
    },
    {
      header: 'Amount',
      align: 'right',
      accessor: (r) => <span className="whitespace-nowrap font-semibold text-slate-900">{formatCurrency(r.amount)}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {slipButton(r, 'row')}
          <ActionButton tone="primary" className="w-[4.25rem]" title={`Edit ${r.staff.name}'s salary`} onClick={() => openEdit(r)}>
            Edit
          </ActionButton>
          <ActionButton
            tone="danger"
            className="w-[4.25rem]"
            title={`Delete ${r.staff.name}'s salary`}
            loading={busyId === r.id}
            onClick={() => setDeleting(r)}
          >
            Delete
          </ActionButton>
        </div>
      ),
    },
  ]

  // Opens the staff member's chat with the slip typed in; hidden when their
  // mobile number is not one WhatsApp can use.
  const slipButton = (r: SalaryRecord, layout: 'row' | 'card') => {
    const link = salarySlipLink(r, user)
    if (!link) return null
    return (
      <ActionButton
        tone="money"
        layout={layout}
        className={layout === 'row' ? 'w-8' : undefined}
        title={`Send ${r.staff.name} the salary slip on WhatsApp`}
        aria-label={`Send ${r.staff.name} the salary slip on WhatsApp`}
        onClick={() => openWhatsapp(link)}
      >
        <WhatsappIcon className="h-4 w-4" />
        {layout === 'card' && 'Slip'}
      </ActionButton>
    )
  }

  const renderCard = (r: SalaryRecord) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        {staffCell(r)}
        <p className="shrink-0 text-base font-semibold text-slate-900">{formatCurrency(r.amount)}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>For {formatSalaryMonth(r.salaryMonth)}</span>
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> {formatSalaryDay(r.paymentDate)}
        </span>
        <Badge tone="neutral">{salaryModeLabel(r.paymentMode)}</Badge>
      </div>
      {r.remarks && <p className="mt-2 text-sm text-slate-600">{r.remarks}</p>}
      <div className="mt-3 flex items-stretch gap-2 border-t border-slate-100 pt-3">
        {slipButton(r, 'card')}
        <ActionButton layout="card" tone="primary" onClick={() => openEdit(r)}>
          Edit
        </ActionButton>
        <ActionButton layout="card" tone="danger" loading={busyId === r.id} onClick={() => setDeleting(r)}>
          Delete
        </ActionButton>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Salary"
        subtitle={periodLabel(filters, fromDate, toDate)}
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            <span className="hidden sm:inline">Add Salary</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Paid" value={summary ? formatCurrency(summary.totalAmount) : '—'} icon={Wallet} tone="primary" />
        <StatCard label="Payments" value={summary ? String(summary.totalRecords) : '—'} icon={ReceiptText} tone="success" />
        <StatCard label="Staff Paid" value={summary ? String(summary.staffCount) : '—'} icon={Users} tone="info" />
      </div>

      {summary && summary.byPaymentMode.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {summary.byPaymentMode.map((m) => (
            <span
              key={m.paymentMode}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
            >
              <IndianRupee className="h-3 w-3 text-slate-400" />
              <span className="font-medium text-slate-800">{salaryModeLabel(m.paymentMode)}</span>
              {formatCurrency(m.amount)} · {m.count}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search staff name, mobile, role, mode or remarks..." />
          </div>
          <Input
            type="date"
            aria-label="From date"
            title="From date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            type="date"
            aria-label="To date"
            title="To date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            error={rangeError || undefined}
          />
        </div>
        {narrowed && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              {!fromDate && !toDate
                ? 'No dates picked, so the current month is shown.'
                : 'The totals above count only the payments these filters match.'}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              <X className="h-3.5 w-3.5" /> Reset to this month
            </button>
          </div>
        )}
      </div>

      {loading && rows.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState title="Could not load salary records" description={error} onRetry={() => void fetchPage()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={narrowed ? 'No salary records match' : 'No salary records this month'}
          description={narrowed ? 'Try a different search or date range.' : 'Add a salary payment to see it here.'}
        />
      ) : (
        <>
          <div className={cn(loading && 'opacity-60')}>
            <ResponsiveList data={rows} columns={columns} keyField={(r) => r.id} renderCard={renderCard} />
          </div>
          {pagination && (
            <PaginationBar pagination={pagination} count={rows.length} onPageChange={setPage} onLimitChange={setLimit} />
          )}
        </>
      )}

      <SalaryFormModal open={formOpen} salary={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void confirmDelete(deleting)
        }}
        title="Delete salary record?"
        message={
          deleting
            ? `${formatCurrency(deleting.amount)} paid to ${deleting.staff.name} on ${formatSalaryDay(deleting.paymentDate)} will be removed from the report.`
            : ''
        }
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
