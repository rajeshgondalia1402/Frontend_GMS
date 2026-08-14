import { useMemo, useState } from 'react'
import { IndianRupee, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { PageHeader, SearchInput, StatCard, FilterButton } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { EmptyState, StatusBadge } from '@/components/ui'
import { payments as allPayments } from '@/mock/payments'
import { formatCurrency } from '@/lib/utils'
import type { Payment } from '@/types'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Successful', value: 'successful' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
]

export function AdminPayments() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(
    () =>
      allPayments.filter((p) => {
        const matchStatus = status === 'all' || p.status === status
        const matchQuery =
          p.id.toLowerCase().includes(query.toLowerCase()) ||
          p.garage.toLowerCase().includes(query.toLowerCase())
        return matchStatus && matchQuery
      }),
    [query, status],
  )

  const columns: Column<Payment>[] = [
    { header: 'Payment ID', accessor: (p) => <span className="font-mono text-xs font-medium text-slate-900">{p.id}</span> },
    { header: 'Garage', accessor: (p) => p.garage },
    { header: 'Plan', accessor: (p) => p.plan },
    { header: 'Amount', accessor: (p) => <span className="font-medium">{formatCurrency(p.amount)}</span> },
    { header: 'Date', accessor: (p) => p.date },
    { header: 'Status', accessor: (p) => <StatusBadge status={p.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Payments" subtitle="Platform transactions" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Revenue" value="₹2,50,000" icon={IndianRupee} tone="primary" />
        <StatCard label="Successful" value="₹2,35,000" icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value="₹5,000" icon={Clock} tone="warning" />
        <StatCard label="Failed" value="₹10,000" icon={XCircle} tone="danger" />
      </div>

      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search payments..." />
      </div>
      <div className="mb-4">
        <FilterButton options={filters} value={status} onChange={setStatus} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={IndianRupee} title="No payments found" description="Try a different search or filter." />
      ) : (
        <ResponsiveList
          data={filtered}
          columns={columns}
          keyField={(p) => p.id}
          renderCard={(p) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-slate-900">{p.id}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-2 font-medium text-slate-800">{p.garage}</p>
              <p className="text-sm text-slate-500">{p.plan} plan</p>
              <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                <span className="text-lg font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                <span className="text-xs text-slate-400">{p.date}</span>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}
