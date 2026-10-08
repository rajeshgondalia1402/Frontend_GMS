import { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { Skeleton } from '@/components/ui'
import { useAdminGrowthChart } from '@/hooks/useAdminGrowthChart'
import { formatCount } from '@/lib/dashboard'
import type { AdminGrowthMonth } from '@/types/admin'

/** How many years the dropdown offers before the server has named them. */
const YEARS_BACK = 5

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Twelve `Jan`…`Dec` labels do not fit under a phone-width chart, so a narrow
 * card writes one letter per month instead; the tooltip still names it in full.
 */
const NARROW_CHART = 480

interface SeriesSpec {
  totalKey: 'totalGarages' | 'totalPaidSubscriptions'
  newKey: 'newGarages' | 'newPaidSubscriptions'
  label: string
  color: string
  /** Dashed for the second line, so the two never rely on colour alone. */
  dash?: string
}

/** Primary blue for garages, emerald-600 for paid subscriptions (validated pair). */
const SERIES: SeriesSpec[] = [
  { totalKey: 'totalGarages', newKey: 'newGarages', label: 'Garages', color: '#3366ff' },
  {
    totalKey: 'totalPaidSubscriptions',
    newKey: 'newPaidSubscriptions',
    label: 'Paid subscriptions',
    color: '#059669',
    dash: '6 4',
  },
]

function Swatch({ spec }: { spec: SeriesSpec }) {
  return (
    <svg width="18" height="8" aria-hidden className="shrink-0">
      <line
        x1="1"
        y1="4"
        x2="17"
        y2="4"
        stroke={spec.color}
        strokeWidth="2"
        strokeDasharray={spec.dash ? '4 3' : undefined}
        strokeLinecap="round"
      />
    </svg>
  )
}

function GrowthTooltip({
  active,
  payload,
  year,
}: TooltipProps<number, string> & { year: number }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as AdminGrowthMonth

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-soft">
      <p className="text-xs font-medium text-slate-500">
        {MONTH_NAMES[row.month - 1]} {year}
      </p>
      {SERIES.map((spec) => (
        <p key={spec.totalKey} className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
          <Swatch spec={spec} />
          <span>{spec.label}:</span>
          <span className="font-semibold text-slate-900">{formatCount(row[spec.totalKey])}</span>
          <span className="text-xs text-slate-400">+{formatCount(row[spec.newKey])} this month</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Garage and subscription growth for one year: the running total of garages
 * registered and of paid subscriptions bought, one point per month. Both are
 * counts, so they share one axis. The headline is what the year added.
 */
export function GrowthChart() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [narrow, setNarrow] = useState(false)
  const { chart, loading, error, reload } = useAdminGrowthChart(year)

  const years =
    chart?.years ?? Array.from({ length: YEARS_BACK }, (_, index) => currentYear - index)
  // Keep the last answer on screen only while it is still for the chosen year.
  const months = chart && chart.year === year ? chart.months : []
  const added = (key: SeriesSpec['newKey']) => months.reduce((sum, row) => sum + row[key], 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">Garage &amp; Subscription Growth</h2>
          <p className="truncate text-xs text-slate-400">Running total at the end of each month</p>
        </div>
        <label className="relative shrink-0">
          <span className="sr-only">Year</span>
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Legend doubles as the year's headline: what each line added in it. */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {SERIES.map((spec) => (
          <div key={spec.totalKey} className="flex items-center gap-1.5 text-xs text-slate-500">
            <Swatch spec={spec} />
            <span>{spec.label}</span>
            {loading ? (
              <Skeleton className="h-4 w-10" />
            ) : error ? null : (
              <span className="font-semibold text-slate-900">
                +{formatCount(added(spec.newKey))} in {year}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 h-64">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 text-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : loading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
            onResize={(width) => setNarrow(width < NARROW_CHART && months.length > 6)}
          >
            <LineChart data={months} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(label: string) => (narrow ? label.charAt(0) : label)}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(value: number) => formatCount(value)}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                content={<GrowthTooltip year={year} />}
              />
              {SERIES.map((spec) => (
                <Line
                  key={spec.totalKey}
                  type="monotone"
                  dataKey={spec.totalKey}
                  name={spec.label}
                  stroke={spec.color}
                  strokeWidth={2}
                  strokeDasharray={spec.dash}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
