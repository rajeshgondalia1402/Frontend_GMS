import type { ReactNode } from 'react'
import { MapPin, MessageCircle, Pencil, Phone, Mail, StickyNote, Building2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { cn, getInitial } from '@/lib/utils'
import type { CustomerRecord } from '@/types/customer'

interface DetailProps {
  icon: LucideIcon
  label: string
  value?: string | null
  className?: string
}

function Detail({ icon: Icon, label, value, className }: DetailProps) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={cn('break-words text-sm', value ? 'text-slate-700' : 'text-slate-400')}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

interface CustomerSummaryCardProps {
  customer: CustomerRecord
  onEdit: () => void
  /** Rendered under the details — the "Add Vehicle" action on the setup page. */
  footer?: ReactNode
}

/** Read-only view of a saved customer, with the details the API stores. */
export function CustomerSummaryCard({ customer, onEdit, footer }: CustomerSummaryCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-lg font-semibold text-primary-600">
            {getInitial(customer.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{customer.fullName}</p>
            <p className="text-sm text-slate-500">Customer</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<Pencil className="h-4 w-4" />}
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <Detail icon={Phone} label="Mobile Number" value={customer.mobileNumber} />
        <Detail icon={MessageCircle} label="WhatsApp Number" value={customer.whatsappNumber} />
        <Detail icon={Mail} label="Email" value={customer.email} />
        <Detail icon={Building2} label="City" value={customer.city} />
        <Detail icon={MapPin} label="Address" value={customer.address} className="sm:col-span-2" />
        <Detail icon={StickyNote} label="Notes" value={customer.notes} className="sm:col-span-2" />
      </div>

      {footer && <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div>}
    </Card>
  )
}
