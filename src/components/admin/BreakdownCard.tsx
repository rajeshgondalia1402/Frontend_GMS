import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui'

export interface BreakdownPart {
  label: string
  value: number
  /** Already formatted — a count, or money with its symbol. */
  display: string
  /** A validated hex; the mark carries it, the text never does. */
  color: string
  hint?: string
}

interface BreakdownCardProps {
  title: string
  caption: string
  icon: LucideIcon
  /** The whole the parts add up to, formatted, shown as the headline. */
  total: string
  totalLabel: string
  parts: BreakdownPart[]
  loading: boolean
  footnote?: string
}

/** `44%` — whole percent, and a dash when there is nothing to share out. */
export function share(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—'
}

/**
 * A whole split into its parts: the total as the headline, one stacked bar
 * showing each part's share, then a row per part with its figure and percent.
 * The rows name every segment, so identity never rests on colour alone.
 */
export function BreakdownCard({
  title,
  caption,
  icon: Icon,
  total,
  totalLabel,
  parts,
  loading,
  footnote,
}: BreakdownCardProps) {
  const whole = parts.reduce((sum, part) => sum + part.value, 0)

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <p className="truncate text-xs text-slate-400">{caption}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-28 rounded-md" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">{total}</p>
        )}
        <p className="mt-0.5 text-xs text-slate-500">{totalLabel}</p>
      </div>

      {/* Segments sit 2px apart so neighbours never bleed into each other. */}
      <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {!loading &&
          whole > 0 &&
          parts
            .filter((part) => part.value > 0)
            .map((part) => (
              <div
                key={part.label}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(part.value / whole) * 100}%`, background: part.color }}
                title={`${part.label}: ${part.display} (${share(part.value, whole)})`}
              />
            ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: part.color }} />
              <span className="truncate text-slate-600">{part.label}</span>
              {part.hint && <span className="hidden truncate text-xs text-slate-400 sm:inline">{part.hint}</span>}
            </span>
            {loading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="font-semibold text-slate-900">{part.display}</span>
                <span className="w-9 text-right text-xs text-slate-400">{share(part.value, whole)}</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      {footnote && <p className="mt-auto pt-4 text-[11px] leading-4 text-slate-400">{footnote}</p>}
    </div>
  )
}
