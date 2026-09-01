import { formatMoney } from '@/lib/jobCard'
import type { JobCardTotals } from '@/lib/jobCard'

interface JobCardSummaryProps {
  totals: JobCardTotals
  /** Held as text so the field can be cleared while it is being typed. */
  discount: string
  onDiscountChange: (value: string) => void
}

export function JobCardSummary({ totals, discount, onDiscountChange }: JobCardSummaryProps) {
  const entered = Number(discount || 0)
  const capped = entered > totals.subtotal

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Subtotal</span>
        <span className="font-semibold text-slate-900">{formatMoney(totals.subtotal)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="shrink-0 text-slate-500">Discount</span>
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            aria-label="Discount"
            placeholder="0.00"
            value={discount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onDiscountChange(e.target.value)}
            className="h-10 w-24 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <span className="w-24 shrink-0 text-right font-semibold text-slate-900">
            {formatMoney(totals.discount)}
          </span>
        </div>
      </div>

      {capped && (
        <p className="text-xs text-amber-600">Discount capped at the subtotal.</p>
      )}

      <div className="border-t border-slate-200 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">Total Amount</span>
          <span className="text-xl font-bold text-primary-600">{formatMoney(totals.total)}</span>
        </div>
      </div>
    </div>
  )
}
