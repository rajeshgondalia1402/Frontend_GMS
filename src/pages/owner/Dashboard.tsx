import { Link } from 'react-router-dom'
import { Users, Car, Wrench, Wallet, Plus, ChevronRight } from 'lucide-react'
import { StatCard } from '@/components/common'
import { SubscriptionBanner } from '@/components/common/SubscriptionBanner'
import { StatusBadge } from '@/components/ui'
import { jobCards } from '@/mock/jobcards'
import { formatCurrency } from '@/lib/utils'

const quickActions = [
  { label: 'Customer', to: '/app/customers/new', icon: Users },
  { label: 'Vehicle', to: '/app/vehicles/new', icon: Car },
  { label: 'Job Card', to: '/app/job-cards/new', icon: Wrench },
]

export function Dashboard() {
  const greeting = 'Good Morning'
  const recent = jobCards.slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-slate-500">{greeting} 👋</p>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">ABC Auto Garage</h1>
      </div>

      <SubscriptionBanner status="trial" daysRemaining={23} />

      {/* Stats */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Today's Overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Customers" value="125" icon={Users} trend="+8 this month" tone="primary" />
          <StatCard label="Vehicles" value="86" icon={Car} trend="+5 this month" tone="info" />
          <StatCard label="Job Cards" value="12" icon={Wrench} trend="4 pending" tone="warning" />
          <StatCard label="Revenue" value="₹18,500" icon={Wallet} trend="Today" tone="success" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-card transition-colors hover:border-primary-200 hover:bg-primary-50/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent job cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent Job Cards</h2>
          <Link to="/app/job-cards" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recent.map((job) => (
            <Link
              key={job.id}
              to={`/app/job-cards/${job.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{job.code}</span>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {job.vehicleName} · {job.customerName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(job.total)}</p>
                <ChevronRight className="ml-auto mt-1 h-4 w-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
