interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  valuePrefix?: string
  valueSuffix?: string
}

const PLOT_HEIGHT = 150 // px, plotting area for the tallest bar

/** Lightweight dependency-free responsive bar chart. */
export function BarChart({ data, color = 'bg-primary-500', valuePrefix = '', valueSuffix = '' }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: PLOT_HEIGHT }}>
        {data.map((d) => (
          <div
            key={d.label}
            className={`flex-1 rounded-t-md ${color} transition-all`}
            style={{ height: Math.max((d.value / max) * PLOT_HEIGHT, 6) }}
            title={`${valuePrefix}${d.value}${valueSuffix}`}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] font-medium text-slate-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
