import { useMemo, useState } from 'react'
import { Wallet, TrendingUp, Clock, Eye, FileText } from 'lucide-react'
import { PageHeader, SearchInput, StatCard, FilterButton } from '@/components/common'
import type { Column } from '@/components/common'
import { ResponsiveList } from '@/components/common'
import { EmptyState, StatusBadge, Button, useToast } from '@/components/ui'
import { invoices as allInvoices } from '@/mock/invoices'
import { formatCurrency } from '@/lib/utils'
import type { Invoice } from '@/types'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
]

export function Billing() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const { toast } = useToast()

  const filtered = useMemo(
    () =>
      allInvoices.filter((i) => {
        const matchStatus = status === 'all' || i.status === status
        const matchQuery =
          i.code.toLowerCase().includes(query.toLowerCase()) ||
          i.customerName.toLowerCase().includes(query.toLowerCase())
        return matchStatus && matchQuery
      }),
    [query, status],
  )

  const columns: Column<Invoice>[] = [
    { header: 'Invoice', accessor: (i) => <span className="font-semibold text-slate-900">{i.code}</span> },
    { header: 'Customer', accessor: (i) => i.customerName },
    { header: 'Amount', accessor: (i) => <span className="font-medium">{formatCurrency(i.amount)}</span> },
    { header: 'Date', accessor: (i) => i.date },
    { header: 'Status', accessor: (i) => <StatusBadge status={i.status} /> },
    {
      header: '',
      className: 'text-right',
      accessor: () => <span className="text-sm font-medium text-primary-600">View</span>,
    },
  ]

  return (
    <div>
      <PageHeader title="Billing" subtitle="Invoices & revenue" />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Revenue" value="₹85,000" icon={Wallet} tone="primary" />
        <StatCard label="Paid" value="₹72,500" icon={TrendingUp} tone="success" />
        <StatCard label="Pending" value="₹12,500" icon={Clock} tone="warning" />
      </div>

      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search invoices..." />
      </div>
      <div className="mb-4">
        <FilterButton options={filters} value={status} onChange={setStatus} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="Invoices will appear here once created." />
      ) : (
        <ResponsiveList
          data={filtered}
          columns={columns}
          keyField={(i) => i.id}
          onRowClick={() => toast('Opening invoice...', 'info')}
          renderCard={(i) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{i.code}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{i.customerName}</p>
                </div>
                <StatusBadge status={i.status} />
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(i.amount)}</p>
                  <p className="text-xs text-slate-400">{i.date}</p>
                </div>
                <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={() => toast('Opening invoice...', 'info')}>
                  View Invoice
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}
