import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { SortOrder } from './DataTable'

export interface SortBarField {
  /** Matches the `sortKey` of the table column that sorts by the same field. */
  key: string
  label: string
}

interface SortBarProps {
  fields: SortBarField[]
  sortBy?: string
  sortOrder?: SortOrder
  onSort: (sortKey: string) => void
  className?: string
}

/**
 * A card list has no table header to click, so the same fields are offered as a
 * row of buttons that behave exactly like the headers: the first click sorts
 * ascending, the next flips it, and the arrow says which way it is going.
 */
export function SortBar({
  fields,
  sortBy,
  sortOrder = 'asc',
  onSort,
  className = '',
}: SortBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sort</span>
      {fields.map((field) => {
        const active = field.key === sortBy
        const ascending = active && sortOrder === 'asc'

        return (
          <button
            key={field.key}
            type="button"
            onClick={() => onSort(field.key)}
            aria-pressed={active}
            title={`Sort by ${field.label} (${ascending ? 'descending' : 'ascending'})`}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'border-primary-200 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {field.label}
            {active ? (
              ascending ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
