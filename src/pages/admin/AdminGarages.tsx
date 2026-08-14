import { useMemo, useState } from 'react'
import { Building2, Eye } from 'lucide-react'
import { PageHeader, SearchInput, FilterButton } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { EmptyState, StatusBadge, Button, useToast } from '@/components/ui'
import { garages as allGarages } from '@/mock/garages'
import type { Garage } from '@/types'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Trial', value: 'trial' },
  { label: 'Expired', value: 'expired' },
]

export function AdminGarages() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const { toast } = useToast()

  const filtered = useMemo(
    () =>
      allGarages.filter((g) => {
        const matchStatus = status === 'all' || g.status === status
        const matchQuery =
          g.name.toLowerCase().includes(query.toLowerCase()) ||
          g.owner.toLowerCase().includes(query.toLowerCase())
        return matchStatus && matchQuery
      }),
    [query, status],
  )

  const columns: Column<Garage>[] = [
    { header: 'Garage', accessor: (g) => <span className="font-medium text-slate-900">{g.name}</span> },
    { header: 'Owner', accessor: (g) => g.owner },
    { header: 'Mobile', accessor: (g) => g.mobile },
    { header: 'Plan', accessor: (g) => g.plan },
    { header: 'Status', accessor: (g) => <StatusBadge status={g.status} /> },
    { header: '', className: 'text-right', accessor: () => <span className="text-sm font-medium text-primary-600">View</span> },
  ]

  return (
    <div>
      <PageHeader title="Garages" subtitle="All registered garages" />

      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search garage..." />
      </div>
      <div className="mb-4">
        <FilterButton options={filters} value={status} onChange={setStatus} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No garages found" description="Try a different search or filter." />
      ) : (
        <ResponsiveList
          data={filtered}
          columns={columns}
          keyField={(g) => g.id}
          onRowClick={() => toast('Opening garage...', 'info')}
          renderCard={(g) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900">{g.name}</p>
                <StatusBadge status={g.status} />
              </div>
              <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                <p>Owner: {g.owner}</p>
                <p>Mobile: {g.mobile}</p>
              </div>
              {g.status === 'trial' && g.daysRemaining != null && (
                <p className="mt-2 text-sm font-medium text-sky-600">{g.daysRemaining} days remaining</p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-500">{g.plan}</span>
                <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={() => toast('Opening garage...', 'info')}>
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
