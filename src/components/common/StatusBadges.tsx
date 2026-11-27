import { Badge, StatusTooltip } from '@/components/ui'
import { jobCardStatusLabel, jobCardStatusTone } from '@/lib/jobCard'
import { paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import type { JobCardStatus, JobPaymentStatus } from '@/types/jobCard'
import { JobCardStatusHelp, PaymentStatusHelp } from './StatusHelp'

interface JobCardStatusBadgeProps {
  status: JobCardStatus
  /** The card's payment status, so the bubble can mark which stage it is at. */
  payment?: JobPaymentStatus
  className?: string
}

/** Pending / Delivered, with a bubble explaining what that means. */
export function JobCardStatusBadge({ status, payment, className }: JobCardStatusBadgeProps) {
  const label = jobCardStatusLabel(status)
  return (
    <StatusTooltip
      label={`What does job card status ${label} mean?`}
      content={<JobCardStatusHelp status={status} payment={payment} />}
      className={className}
    >
      <Badge tone={jobCardStatusTone(status)}>{label}</Badge>
    </StatusTooltip>
  )
}

interface PaymentStatusBadgeProps {
  payment: JobPaymentStatus
  /** The card's own status, so the bubble can mark which stage it is at. */
  status?: JobCardStatus
  className?: string
}

/** Unpaid / Partial Paid / Paid, with a bubble explaining what that means. */
export function PaymentStatusBadge({ payment, status, className }: PaymentStatusBadgeProps) {
  const label = paymentStatusLabel(payment)
  return (
    <StatusTooltip
      label={`What does payment status ${label} mean?`}
      content={<PaymentStatusHelp payment={payment} status={status} />}
      className={className}
    >
      <Badge tone={paymentStatusTone(payment)}>{label}</Badge>
    </StatusTooltip>
  )
}
