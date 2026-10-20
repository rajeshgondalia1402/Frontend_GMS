import { CalendarClock, IndianRupee, Users, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A still of the owner dashboard, drawn with the app's own tile, chart and row
 * shapes.
 *
 * **Every figure here is illustrative.** The real screen reads them from
 * `GET /auth/dashboard/summary` behind the owner's token; nothing on the
 * public site touches a garage's data, and nothing here is fetched.
 */

const tiles = [
  { label: 'Total Revenue', value: '₹4,86,200', icon: IndianRupee, tone: 'emerald' },
  { label: 'Revenue This Month', value: '₹62,450', icon: CalendarClock, tone: 'primary' },
  { label: 'New Customers', value: '38', icon: Users, tone: 'sky' },
  { label: 'New Job Cards', value: '112', icon: Wrench, tone: 'violet' },
] as const

const tileTones: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  primary: 'bg-primary-50 text-primary-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
}

/** Month label and the bar's height as a share of the tallest month. */
const months: [string, number][] = [
  ['Apr', 0.42],
  ['May', 0.55],
  ['Jun', 0.38],
  ['Jul', 0.68],
  ['Aug', 0.52],
  ['Sep', 0.82],
  ['Oct', 1],
]

const rows = [
  { job: 'JC-2026-0112', vehicle: 'GJ01AB1234', amount: '₹7,400', state: 'Paid' },
  { job: 'JC-2026-0111', vehicle: 'GJ05CD8821', amount: '₹2,150', state: 'Partial' },
  { job: 'JC-2026-0110', vehicle: 'MH12EF4470', amount: '₹12,900', state: 'Unpaid' },
]

const stateTones: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700',
  Partial: 'bg-amber-50 text-amber-700',
  Unpaid: 'bg-red-50 text-red-700',
}

export function DashboardPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-primary-950/30">
        {/* Window chrome — says "this is the app" without a screenshot that
            would go stale the next time the dashboard changes. */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="ml-1 truncate text-[11px] font-medium text-slate-500">
            GaragePilot · Dashboard
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Good Morning, Rajesh</p>
              <p className="truncate text-sm font-bold text-slate-900">Shree Auto Works</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
              Free Trial · 25 days left
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-xl border border-slate-200 p-3">
                {/* The icon takes a line of its own so the label keeps the
                    full tile width — four tiles across leave too little room
                    to put them side by side without truncating. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md',
                    tileTones[tile.tone],
                  )}
                >
                  <tile.icon className="h-3.5 w-3.5" />
                </span>
                <p className="mt-2 min-h-[26px] text-[10px] leading-tight text-slate-500">
                  {tile.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-900 sm:text-base">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-2.5 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 p-3 lg:col-span-3">
              <p className="text-[11px] font-semibold text-slate-700">Revenue Overview</p>
              {/* The bars sit in a row of their own with a fixed height: a
                  percentage height only resolves against a parent that has
                  one, and the labels below would otherwise eat into it. */}
              <div className="mt-3" aria-hidden="true">
                <div className="flex h-20 items-end gap-1.5">
                  {months.map(([month, share]) => (
                    <div
                      key={month}
                      className={cn(
                        'flex-1 rounded-t bg-primary-500/85',
                        share === 1 && 'bg-primary-600',
                      )}
                      style={{ height: `${Math.round(share * 100)}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {months.map(([month]) => (
                    <span key={month} className="flex-1 text-center text-[9px] text-slate-500">
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 lg:col-span-2">
              <p className="text-[11px] font-semibold text-slate-700">Recent Job Cards</p>
              <ul className="mt-2.5 space-y-2">
                {rows.map((row) => (
                  <li key={row.job} className="flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-medium text-slate-800">
                        {row.job}
                      </span>
                      <span className="block truncate text-[10px] text-slate-500">
                        {row.vehicle}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-[11px] font-semibold text-slate-900">{row.amount}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                          stateTones[row.state],
                        )}
                      >
                        {row.state}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-slate-500">
        Dashboard layout shown with illustrative figures — not real garage data.
      </figcaption>
    </figure>
  )
}
