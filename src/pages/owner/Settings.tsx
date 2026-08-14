import { useNavigate } from 'react-router-dom'
import { User, Building2, Clock, Bell, Shield, CreditCard, ChevronRight, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, useToast } from '@/components/ui'

interface SettingItem {
  label: string
  description: string
  icon: LucideIcon
  to?: string
}

const items: SettingItem[] = [
  { label: 'Profile', description: 'Owner name, contact details', icon: User, to: '/app/profile' },
  { label: 'Garage Details', description: 'Name, address, GST', icon: Building2, to: '/app/profile' },
  { label: 'Working Hours', description: 'Business days and timings', icon: Clock, to: '/app/profile' },
  { label: 'Notifications', description: 'Alerts and reminders', icon: Bell },
  { label: 'Security', description: 'Password and login', icon: Shield },
  { label: 'Subscription', description: 'Plan and billing', icon: CreditCard, to: '/app/subscription' },
]

export function Settings() {
  const navigate = useNavigate()
  const { toast } = useToast()

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and garage" />

      <div className="max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {items.map((item, i) => (
          <button
            key={item.label}
            onClick={() => (item.to ? navigate(item.to) : toast('Coming soon', 'info'))}
            className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 ${
              i !== items.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <item.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="truncate text-sm text-slate-500">{item.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
          </button>
        ))}
      </div>

      <div className="mt-5 max-w-2xl">
        <Button variant="outline" fullWidth className="text-red-600 lg:w-auto" leftIcon={<LogOut className="h-4 w-4" />} onClick={() => navigate('/login')}>
          Logout
        </Button>
      </div>
    </div>
  )
}
