import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Car, Eye } from 'lucide-react'
import { PageHeader, SearchInput } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { Button, EmptyState, Badge } from '@/components/ui'
import { vehicles as allVehicles } from '@/mock/vehicles'
import type { Vehicle } from '@/types'

export function Vehicles() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(
    () =>
      allVehicles.filter(
        (v) =>
          v.number.toLowerCase().includes(query.toLowerCase()) ||
          v.name.toLowerCase().includes(query.toLowerCase()) ||
          v.ownerName.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  const columns: Column<Vehicle>[] = [
    { header: 'Vehicle', accessor: (v) => <span className="font-medium text-slate-900">{v.name}</span> },
    { header: 'Number', accessor: (v) => <span className="font-mono text-xs">{v.number}</span> },
    { header: 'Owner', accessor: (v) => v.ownerName },
    { header: 'Fuel', accessor: (v) => <Badge tone="neutral">{v.fuelType}</Badge> },
    { header: 'Last Service', accessor: (v) => v.lastService },
    { header: '', className: 'text-right', accessor: () => <span className="text-sm font-medium text-primary-600">View</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="All registered vehicles"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/vehicles/new')}>
            <span className="hidden sm:inline">Add Vehicle</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Search vehicle..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          description="Try a different search, or add a new vehicle."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/vehicles/new')}>
              Add Vehicle
            </Button>
          }
        />
      ) : (
        <ResponsiveList
          data={filtered}
          columns={columns}
          keyField={(v) => v.id}
          onRowClick={(v) => navigate(`/app/vehicles/${v.id}`)}
          renderCard={(v) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{v.name}</p>
                  <p className="mt-0.5 font-mono text-sm text-slate-500">{v.number}</p>
                </div>
                <Badge tone="neutral">{v.fuelType}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-400">Owner</p>
                  <p className="truncate text-sm text-slate-600">{v.ownerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Last Service</p>
                  <p className="text-sm text-slate-600">{v.lastService}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={() => navigate(`/app/vehicles/${v.id}`)}>
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
