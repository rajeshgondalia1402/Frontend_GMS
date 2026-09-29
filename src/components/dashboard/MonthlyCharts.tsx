import { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { Skeleton } from '@/components/ui'
import { useDashboardMonthly } from '@/hooks/useDashboardMonthly'
import { formatCount } from '@/lib/dashboard'
import { formatCurrency } from '@/lib/utils'
import type { DashboardChartMonth } from '@/types/dashboard'

/** How many years the dropdown offers before the server has named them. */
const YEARS_BACK = 5

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** `₹1.2L`, `₹45K` — short enough for the y axis; the tooltip has the full figure. */
function compactCurrency(value: number): string {
  if (value >= 1_00_00_000) return `₹${+(value / 1_00_00_000).toFixed(1)}Cr`
  if (value >= 1_00_000) return `₹${+(value / 1_00_000).toFixed(1)}L`
  if (value >= 1_000) return `₹${+(value / 1_000).toFixed(1)}K`
  return `₹${value}`
}

type Metric = 'revenue' | 'jobCards'

interface ChartSpec {
  title: string
  caption: string
  /** Same colours as the matching tiles above: money green, job cards violet. */
  color: string
  format: (value: number) => string
  axisFormat: (value: number) => string
  seriesLabel: string
}

const CHARTS: Record<Metric, ChartSpec> = {
  revenue: {
    title: 'Revenue Overview',
    caption: 'Collected each month',
    color: '#10b981',
    format: formatCurrency,
    axisFormat: compactCurrency,
    seriesLabel: 'Revenue',
  },
  jobCards: {
    title: 'Vehicle Services',
    caption: 'Job cards opened each month',
    color: '#8b5cf6',
    format: formatCount,
    axisFormat: (value) => formatCount(value),
    seriesLabel: 'Vehicles serviced',
  },
}

function ChartTooltip({
  active,
  payload,
  spec,
  year,
}: TooltipProps<number, string> & { spec: ChartSpec; year: number }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as DashboardChartMonth

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-soft">
      <p className="text-xs font-medium text-slate-500">
        {MONTH_NAMES[row.month - 1]} {year}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: spec.color }} />
        {spec.seriesLabel}: {spec.format(Number(payload[0].value ?? 0))}
      </p>
    </div>
  )
}

interface ChartCardProps {
  metric: Metric
  months: DashboardChartMonth[]
  year: number
  loading: boolean
}

/**
 * Twelve `Jan`…`Dec` labels do not fit under a phone-width chart, so a narrow
 * card writes one letter per month instead; the tooltip still names it in full.
 */
const NARROW_CHART = 480

/** One metric for the year: its total as the headline, then a bar per month. */
function ChartCard({ metric, months, year, loading }: ChartCardProps) {
  const spec = CHARTS[metric]
  const [narrow, setNarrow] = useState(false)
  const total = months.reduce((sum, row) => sum + row[metric], 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-700">{spec.title}</h3>
          <p className="truncate text-xs text-slate-400">{spec.caption}</p>
        </div>
        <div className="shrink-0 text-right">
          {loading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <p className="text-lg font-bold text-slate-900">{spec.format(total)}</p>
          )}
          <p className="text-xs text-slate-400">Total in {year}</p>
        </div>
      </div>

      <div className="mt-4 h-64">
        {loading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
            onResize={(width) => setNarrow(width < NARROW_CHART && months.length > 6)}
          >
            <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                tickFormatter={spec.axisFormat}
                allowDecimals={false}
                width={56}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={<ChartTooltip spec={spec} year={year} />}
              />
              <Bar
                dataKey={metric}
                name={spec.seriesLabel}
                fill={spec.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/**
 * The year at a glance: revenue collected and vehicles serviced, month by
 * month. The current year runs January to this month; a past year is all
 * twelve. One year dropdown drives both charts.
 */
export function MonthlyCharts() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { chart, loading, error, reload } = useDashboardMonthly(year)

  const years =
    chart?.years ?? Array.from({ length: YEARS_BACK }, (_, index) => currentYear - index)
  // Keep the last answer on screen only while it is still for the chosen year.
  const months = chart && chart.year === year ? chart.months : []

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Year Overview</h2>
          <span className="truncate text-xs text-slate-400">Month by month</span>
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

      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard metric="revenue" months={months} year={year} loading={loading} />
          <ChartCard metric="jobCards" months={months} year={year} loading={loading} />
        </div>
      )}
    </section>
  )
}
