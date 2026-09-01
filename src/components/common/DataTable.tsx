import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type SortOrder = 'asc' | 'desc'

export interface Column<T> {
  header: string
  accessor: (row: T) => ReactNode
  className?: string
  /**
   * Field this column sorts by. Set it — and pass `onSort` to the table — to
   * make the header clickable; columns without one stay plain text.
   */
  sortKey?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: (row: T) => string
  onRowClick?: (row: T) => void
  /** Full-width detail row rendered under a row while it is expanded. */
  renderExpanded?: (row: T) => ReactNode
  isExpanded?: (row: T) => boolean
  /** The `sortKey` currently ordering the data, if any. */
  sortBy?: string
  sortOrder?: SortOrder
  /** Called with the clicked column's `sortKey`. Without it no header sorts. */
  onSort?: (sortKey: string) => void
}

const HEADER_CLASS =
  'whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600'

export function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  renderExpanded,
  isExpanded,
  sortBy,
  sortOrder = 'asc',
  onSort,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            {/* A touch bolder and wider than the rows, on a slightly deeper
                band, so the header reads as a header without going dark. */}
            <tr className="border-b border-slate-200 bg-slate-100/80">
              {columns.map((col, i) => {
                const className = `${HEADER_CLASS} ${col.className ?? ''}`

                if (!col.sortKey || !onSort) {
                  return (
                    <th key={i} className={className}>
                      {col.header}
                    </th>
                  )
                }

                // The active column shows the direction it is ordering by; the
                // rest show a faint double arrow, so it reads as "clickable".
                const active = col.sortKey === sortBy
                const ascending = active && sortOrder === 'asc'

                return (
                  <th
                    key={i}
                    className={className}
                    aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(col.sortKey as string)}
                      title={`Sort by ${col.header} (${ascending ? 'descending' : 'ascending'})`}
                      className={`group inline-flex items-center gap-1 transition-colors hover:text-slate-900 ${
                        active ? 'text-slate-900' : ''
                      }`}
                    >
                      {col.header}
                      {active ? (
                        ascending ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <Fragment key={keyField(row)}>
                <tr
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50' : ''}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={`px-4 py-3.5 text-slate-700 ${col.className ?? ''}`}>
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
                {renderExpanded && isExpanded?.(row) && (
                  <tr className="bg-slate-50">
                    <td colSpan={columns.length} className="px-4 py-3">
                      {renderExpanded(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
