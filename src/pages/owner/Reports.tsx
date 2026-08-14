import { Wallet, Wrench, Users, Car } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/common'
import { BarChart } from '@/components/common/BarChart'
import { Card } from '@/components/ui'
import { revenueByMonth, jobsByMonth } from '@/mock/dashboard'

export function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Business performance overview" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue" value="₹2,50,000" icon={Wallet} tone="primary" />
        <StatCard label="Job Cards" value="185" icon={Wrench} tone="info" />
        <StatCard label="Customers" value="125" icon={Users} tone="success" />
        <StatCard label="Vehicles" value="160" icon={Car} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Revenue (₹ thousands)</h2>
            <span className="text-xs font-medium text-emerald-600">+12% MoM</span>
          </div>
          <BarChart data={revenueByMonth} color="bg-primary-500" valuePrefix="₹" valueSuffix="k" />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Job Cards</h2>
            <span className="text-xs font-medium text-emerald-600">+6% MoM</span>
          </div>
          <BarChart data={jobsByMonth} color="bg-emerald-500" />
        </Card>
      </div>
    </div>
  )
}
