import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wrench, Eye } from 'lucide-react'
import { PageHeader, SearchInput, FilterButton } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { Button, EmptyState, StatusBadge } from '@/components/ui'
import { jobCards as allJobs } from '@/mock/jobcards'
import { formatCurrency } from '@/lib/utils'
import type { JobCard } from '@/types'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Delivered', value: 'delivered' },
]

export function JobCards() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const navigate = useNavigate()

  const filtered = useMemo(
    () =>
      allJobs.filter((j) => {
        const matchesStatus = status === 'all' || j.status === status
        const matchesQuery =
          j.code.toLowerCase().includes(query.toLowerCase()) ||
          j.customerName.toLowerCase().includes(query.toLowerCase()) ||
          j.vehicleNumber.toLowerCase().includes(query.toLowerCase())
        return matchesStatus && matchesQuery
      }),
    [query, status],
  )

  const columns: Column<JobCard>[] = [
    { header: 'Job', accessor: (j) => <span className="font-semibold text-slate-900">{j.code}</span> },
    { header: 'Vehicle', accessor: (j) => `${j.vehicleName} · ${j.vehicleNumber}` },
    { header: 'Customer', accessor: (j) => j.customerName },
    { header: 'Amount', accessor: (j) => <span className="font-medium">{formatCurrency(j.total)}</span> },
    { header: 'Status', accessor: (j) => <StatusBadge status={j.status} /> },
    { header: '', className: 'text-right', accessor: () => <span className="text-sm font-medium text-primary-600">View</span> },
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

      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search job cards..." />
      </div>
      <div className="mb-4">
        <FilterButton options={filters} value={status} onChange={setStatus} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No job cards found"
          description="Adjust your filters, or create a new job card."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/job-cards/new')}>
              New Job Card
            </Button>
          }
        />
      ) : (
        <ResponsiveList
          data={filtered}
          columns={columns}
          keyField={(j) => j.id}
          onRowClick={(j) => navigate(`/app/job-cards/${j.id}`)}
          renderCard={(j) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">{j.code}</span>
                <StatusBadge status={j.status} />
              </div>
              <p className="mt-2 font-medium text-slate-800">{j.vehicleName}</p>
              <p className="font-mono text-sm text-slate-500">{j.vehicleNumber}</p>
              <p className="mt-1 text-sm text-slate-600">{j.customerName}</p>
              <p className="mt-2 text-sm text-slate-500">{j.services.join(', ')}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-base font-semibold text-slate-900">{formatCurrency(j.total)}</span>
                <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={() => navigate(`/app/job-cards/${j.id}`)}>
                  View
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}
