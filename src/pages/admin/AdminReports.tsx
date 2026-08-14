import { TrendingUp, Building2, RefreshCw, XCircle, ArrowUpRight, Percent } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/common'
import { BarChart } from '@/components/common/BarChart'
import { Card } from '@/components/ui'
import { revenueByMonth } from '@/mock/dashboard'

const newGarages = [
  { label: 'Mar', value: 65 },
  { label: 'Apr', value: 80 },
  { label: 'May', value: 72 },
  { label: 'Jun', value: 95 },
  { label: 'Jul', value: 88 },
  { label: 'Aug', value: 110 },
]

export function AdminReports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Platform analytics" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Revenue" value="₹2,50,000" icon={TrendingUp} tone="primary" />
        <StatCard label="New Garages" value="110" icon={Building2} tone="success" />
        <StatCard label="Active Subs" value="1,100" icon={RefreshCw} tone="info" />
        <StatCard label="Expired Subs" value="150" icon={XCircle} tone="danger" />
        <StatCard label="Trial Conversion" value="62%" icon={Percent} tone="warning" />
        <StatCard label="Monthly Growth" value="+12%" icon={ArrowUpRight} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Revenue (₹ thousands)</h2>
          <BarChart data={revenueByMonth} color="bg-primary-500" />
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-700">New Garages</h2>
          <BarChart data={newGarages} color="bg-emerald-500" />
        </Card>
      </div>
    </div>
  )
}
