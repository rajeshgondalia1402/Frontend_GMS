import { useMemo } from 'react'
import { Wallet, TrendingUp, Clock, Users } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/common'
import { EmptyState, StatusBadge, Button, useToast } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { StaffMember } from '@/types'

// No salary API yet: the page stays empty until staff salaries come from the backend.
const staff: StaffMember[] = []

export function Salary() {
  const { toast } = useToast()

  const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const totals = useMemo(() => {
    const sum = (list: StaffMember[]) => list.reduce((total, s) => total + s.salary, 0)
    return {
      salary: sum(staff),
      paid: sum(staff.filter((s) => s.salaryStatus === 'paid')),
      pending: sum(staff.filter((s) => s.salaryStatus !== 'paid')),
    }
  }, [])

  return (
    <div>
      <PageHeader title="Salary" subtitle={month} />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Salary" value={formatCurrency(totals.salary)} icon={Wallet} tone="primary" />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} icon={TrendingUp} tone="success" />
        <StatCard label="Pending" value={formatCurrency(totals.pending)} icon={Clock} tone="warning" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Staff Salary</h2>
      {staff.length === 0 ? (
        <EmptyState icon={Users} title="No salary records yet" description="Staff salaries will appear here once added." />
      ) : (
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
      )}
    </div>
  )
}
