import { Building2, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/common'
import { BarChart } from '@/components/common/BarChart'
import { Card, StatusBadge } from '@/components/ui'
import { revenueByMonth } from '@/mock/dashboard'
import { garages } from '@/mock/garages'

export function AdminDashboard() {
  const recent = garages.slice(0, 5)

  return (
    <div>
      <PageHeader title="Platform Dashboard" subtitle="Overview of all garages on GaragePro" />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Garages" value="1,250" icon={Building2} tone="primary" />
        <StatCard label="Active" value="1,100" icon={CheckCircle2} tone="success" />
        <StatCard label="Trial" value="180" icon={Clock} tone="info" />
        <StatCard label="Expired" value="150" icon={XCircle} tone="danger" />
        <StatCard label="Revenue" value="₹85,000" icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Monthly Revenue (₹ thousands)</h2>
            <span className="text-xs font-medium text-emerald-600">+12% MoM</span>
          </div>
          <BarChart data={revenueByMonth} color="bg-primary-500" />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent Garages</h2>
          <div className="space-y-3">
            {recent.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{g.name}</p>
                  <p className="truncate text-xs text-slate-500">{g.owner}</p>
                </div>
                <StatusBadge status={g.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
