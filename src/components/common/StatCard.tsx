import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon?: LucideIcon
  trend?: string
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const tones = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-sky-50 text-sky-600',
}

export function StatCard({ label, value, icon: Icon, trend, tone = 'primary' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && <p className="mt-2 truncate text-xs text-slate-400">{trend}</p>}
    </div>
  )
}
