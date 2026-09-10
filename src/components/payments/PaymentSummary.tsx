import { Badge } from '@/components/ui'
import { formatMoney } from '@/lib/jobCard'
import { paidBarClass, paidPercent, paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import { cn } from '@/lib/utils'
import type { JobCardMoney } from '@/types/payment'

interface PaymentSummaryProps {
  money: JobCardMoney
  className?: string
}

/**
 * The three numbers the desk reads off the card — what it came to, what is in,
 * and what is still to pay — with the balance given the most weight because it
 * is the one said out loud to the customer.
 *
 * The bar underneath is the same reading again at a glance, in the tone the
 * status badge is already wearing, so a card can be sorted into settled or not
 * without reading any of the figures.
 */
export function PaymentSummary({ money, className }: PaymentSummaryProps) {
  const percent = paidPercent(money.paidAmount, money.totalAmount)
  const settled = money.remainingAmount <= 0

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {settled ? 'Nothing left to pay' : 'Balance to collect'}
          </p>
          <p
            className={cn(
              'mt-0.5 text-3xl font-bold tabular-nums sm:text-4xl',
              settled ? 'text-emerald-600' : 'text-slate-900',
            )}
          >
            {formatMoney(money.remainingAmount)}
          </p>
        </div>
        <Badge tone={paymentStatusTone(money.paymentStatus)}>
          {paymentStatusLabel(money.paymentStatus)}
        </Badge>
      </div>

      <div className="mt-4">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of the bill collected"
        >
          <div
            className={cn('h-full rounded-full transition-all', paidBarClass(money.paymentStatus))}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {percent}% of the bill collected
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div>
          <dt className="text-xs text-slate-500">Bill Total</dt>
          <dd className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
            {formatMoney(money.totalAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Collected</dt>
          <dd className="mt-0.5 text-base font-semibold tabular-nums text-emerald-600">
            {formatMoney(money.paidAmount)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
