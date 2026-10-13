import { Check } from 'lucide-react'
import { WhatsappIcon } from '@/components/ui'

/**
 * A job card's bill and the receipts behind it, drawn with the app's own
 * table, badge and summary shapes.
 *
 * **Illustrative throughout** — the real screen reads the card and its
 * receipts from `GET /auth/payment/job-card/:id` behind the owner's token.
 */

const lines = [
  { description: 'Engine oil 5W-30 (4 L)', qty: 1, rate: 2_600 },
  { description: 'Oil filter', qty: 1, rate: 420 },
  { description: 'Front brake pads', qty: 2, rate: 1_150 },
  { description: 'General service — labour', qty: 1, rate: 900 },
]

const total = lines.reduce((sum, line) => sum + line.qty * line.rate, 0)
const receipts = [
  { no: 1, date: '02-Oct-2026', method: 'Cash', amount: 3_000 },
  { no: 2, date: '04-Oct-2026', method: 'UPI', amount: 2_000 },
]
const paid = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
const balance = total - paid
const rupees = (amount: number) => '₹' + amount.toLocaleString('en-IN')

export function BillPreview() {
  return (
    <figure className="m-0 grid gap-4 lg:grid-cols-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">JC-2026-0112</p>
            <p className="truncate text-xs text-slate-500">GJ01AB1234 · Maruti Swift VDi</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            Partially Paid
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left">
            <caption className="sr-only">Illustrative billed lines on a job card</caption>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Item
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Qty
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => (
                <tr key={line.description}>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{line.description}</td>
                  <td className="px-2 py-2.5 text-right text-xs text-slate-500">{line.qty}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium text-slate-900">
                    {rupees(line.qty * line.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <th scope="row" colSpan={2} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                  Total billed
                </th>
                <td className="px-4 py-2.5 text-right text-sm font-bold text-slate-900">
                  {rupees(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:col-span-2">
        <p className="text-sm font-semibold text-slate-900">Payments</p>

        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Paid</dt>
            <dd className="font-semibold text-emerald-700">{rupees(paid)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Balance due</dt>
            <dd className="font-semibold text-amber-700">{rupees(balance)}</dd>
          </div>
        </dl>

        <div
          aria-hidden="true"
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.round((paid / total) * 100)}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
          {receipts.map((receipt) => (
            <li key={receipt.no} className="flex items-start justify-between gap-2">
              <span className="flex min-w-0 items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-slate-800">
                    Receipt #{receipt.no} · {receipt.method}
                  </span>
                  <span className="block text-[10px] text-slate-500">{receipt.date}</span>
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-slate-900">
                {rupees(receipt.amount)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <WhatsappIcon className="h-3.5 w-3.5 text-emerald-600" />
          Each receipt can be sent to the customer on WhatsApp.
        </p>
      </div>

      <figcaption className="text-center text-xs text-slate-500 lg:col-span-5">
        A job card and its receipts, shown with illustrative figures.
      </figcaption>
    </figure>
  )
}
