import { Pencil, Receipt, StickyNote, Trash2 } from 'lucide-react'
import { WhatsappIcon } from '@/components/ui'
import { formatMoney } from '@/lib/jobCard'
import { formatPaymentDate, paymentMethodIcon, paymentMethodLabel } from '@/lib/payment'
import type { PaymentRecord } from '@/types/payment'

interface PaymentHistoryProps {
  payments: PaymentRecord[]
  onEdit: (payment: PaymentRecord) => void
  onCancel: (payment: PaymentRecord) => void
  /**
   * Sends that receipt to the customer again. Left out when there is no
   * WhatsApp number on file, which takes the button off every row.
   */
  onWhatsapp?: (payment: PaymentRecord) => void
  /** Locks the row actions while a receipt is being saved or cancelled. */
  busy?: boolean
}

/**
 * Every receipt on the card, oldest first — the order the money came in, which
 * is how a garage reads a part-paid bill back to a customer.
 *
 * A cancelled receipt is not here: the API soft deletes it and leaves it out of
 * this list, so what is on screen is always what the balance was worked out
 * from.
 */
export function PaymentHistory({
  payments,
  onEdit,
  onCancel,
  onWhatsapp,
  busy,
}: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Receipt className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-slate-900">Nothing collected yet</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          The first receipt you record shows up here, with what was taken and how.
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-2.5">
      {payments.map((payment) => {
        const Icon = paymentMethodIcon(payment.paymentMethod)

        return (
          <li
            key={payment.id}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-card sm:p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {paymentMethodLabel(payment.paymentMethod)}
                  </p>
                  <p className="text-base font-bold tabular-nums text-slate-900">
                    {formatMoney(payment.amount)}
                  </p>
                </div>

                <p className="mt-0.5 text-xs text-slate-500">
                  {formatPaymentDate(payment.paymentDate)}
                  {payment.receivedBy && ` · taken by ${payment.receivedBy}`}
                </p>

                {payment.note && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    <StickyNote className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 whitespace-pre-wrap break-words">{payment.note}</span>
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-1">
                  {/*
                    A receipt can be sent whenever it is asked for — the
                    customer lost the message, or is only now asking what is
                    still owing. The balance quoted is the one on the card as
                    it stands now, not as it stood when the money came in.
                  */}
                  {onWhatsapp && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onWhatsapp(payment)}
                      title="Send this receipt on WhatsApp"
                      aria-label="Send this receipt on WhatsApp"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                    >
                      <WhatsappIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onEdit(payment)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Correct
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onCancel(payment)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
