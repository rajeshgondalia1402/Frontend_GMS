import { Wallet, TrendingUp, Clock } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/common'
import { StatusBadge, Button, useToast } from '@/components/ui'
import { staff } from '@/mock/staff'
import { formatCurrency } from '@/lib/utils'

export function Salary() {
  const { toast } = useToast()

  return (
    <div>
      <PageHeader title="Salary" subtitle="August 2026" />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Salary" value="₹85,000" icon={Wallet} tone="primary" />
        <StatCard label="Paid" value="₹70,000" icon={TrendingUp} tone="success" />
        <StatCard label="Pending" value="₹15,000" icon={Clock} tone="warning" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Staff Salary</h2>
      <div className="space-y-3">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {s.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-sm text-slate-500">{s.role}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-slate-900">{formatCurrency(s.salary)}</p>
              <div className="mt-1 flex justify-end">
                <StatusBadge status={s.salaryStatus} />
              </div>
            </div>
            {s.salaryStatus === 'pending' && (
              <Button size="sm" className="shrink-0" onClick={() => toast(`Marked ${s.name}'s salary as paid`, 'success')}>
                Pay
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
