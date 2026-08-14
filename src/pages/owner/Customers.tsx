import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, Car, Users, Eye } from 'lucide-react'
import { PageHeader, SearchInput, StatCard } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { Button, EmptyState } from '@/components/ui'
import { customers as allCustomers } from '@/mock/customers'
import type { Customer } from '@/types'

export function Customers() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(
    () =>
      allCustomers.filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.mobile.includes(query),
      ),
    [query],
  )

  const columns: Column<Customer>[] = [
    { header: 'Name', accessor: (c) => <span className="font-medium text-slate-900">{c.name}</span> },
    { header: 'Mobile', accessor: (c) => c.mobile },
    { header: 'Vehicles', accessor: (c) => `${c.vehicleCount}` },
    { header: 'Last Visit', accessor: (c) => c.lastVisit },
    {
      header: '',
      className: 'text-right',
      accessor: () => <span className="text-sm font-medium text-primary-600">View</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your garage customers"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/customers/new')}>
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total Customers" value="125" icon={Users} tone="primary" />
        <StatCard label="New this month" value="8" icon={Plus} tone="success" />
      </div>

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Search customer..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Try a different search, or add your first customer."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/app/customers/new')}>
              Add Customer
            </Button>
          }
        />
      ) : (
        <ResponsiveList
          data={filtered}
          columns={columns}
          keyField={(c) => c.id}
          onRowClick={(c) => navigate(`/app/customers/${c.id}`)}
          renderCard={(c) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Phone className="h-3.5 w-3.5" /> {c.mobile}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <Car className="h-3.5 w-3.5" /> {c.vehicleCount}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-400">Last Visit</p>
                  <p className="text-sm text-slate-600">{c.lastVisit}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Eye className="h-4 w-4" />}
                  onClick={() => navigate(`/app/customers/${c.id}`)}
                >
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
