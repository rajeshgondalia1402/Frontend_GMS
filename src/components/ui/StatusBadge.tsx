import { Badge } from './Badge'
import type { JobStatus, InvoiceStatus, PaymentStatus, GarageStatus, SubscriptionStatus, StaffStatus, SalaryStatus } from '@/types'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type AnyStatus = JobStatus | InvoiceStatus | PaymentStatus | GarageStatus | SubscriptionStatus | StaffStatus | SalaryStatus

const config: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  'in-progress': { label: 'In Progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'primary' },
  delivered: { label: 'Delivered', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
  successful: { label: 'Successful', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  trial: { label: 'Trial', tone: 'info' },
  expiring: { label: 'Expiring', tone: 'warning' },
  expired: { label: 'Expired', tone: 'danger' },
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const c = config[status] ?? { label: status, tone: 'neutral' as Tone }
  return <Badge tone={c.tone}>{c.label}</Badge>
}
