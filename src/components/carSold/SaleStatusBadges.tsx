import { Check, CircleDollarSign, Truck } from 'lucide-react'
import { Badge } from '@/components/ui'
import { paymentStatusLabel } from '@/lib/carSold'
import type { CarSoldCustomerRecord } from '@/types/carSold'

interface SaleStatusBadgesProps {
  /** `null` for a car marked sold without a buyer being recorded. */
  sale: CarSoldCustomerRecord | null
  className?: string
}

/**
 * Where a sale stands: the money and the delivery, read at a glance.
 *
 * A car sale has only two payment statuses — paid off, or still owing — so a
 * sale with nothing against it is `PARTIAL` too. It reads "Nothing paid"
 * rather than "Partial", which would suggest money had changed hands.
 */
export function SaleStatusBadges({ sale, className = '' }: SaleStatusBadgesProps) {
  if (!sale) {
    return (
      <Badge tone="neutral" className={className}>
        No buyer recorded
      </Badge>
    )
  }

  const paid = sale.paymentStatus === 'PAID'
  const delivered = sale.deliveredStatus === 'DELIVERED'

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <Badge tone={paid ? 'success' : sale.paidAmount > 0 ? 'warning' : 'danger'}>
        {paid ? <Check className="h-3 w-3" /> : <CircleDollarSign className="h-3 w-3" />}
        {paymentStatusLabel(sale)}
      </Badge>
      <Badge tone={delivered ? 'success' : 'neutral'}>
        <Truck className="h-3 w-3" />
        {delivered ? 'Delivered' : 'Not delivered'}
      </Badge>
    </div>
  )
}
