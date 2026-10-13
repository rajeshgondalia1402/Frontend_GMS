import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOrder = 'asc' | 'desc'

/** Where a column sits in its cell. Money reads right, a label reads left. */
export type ColumnAlign = 'left' | 'center' | 'right'

export interface Column<T> {
  header: string
  accessor: (row: T) => ReactNode
  className?: string
  /**
   * Applied to the header and to every cell under it, so a column and the
   * word naming it always line up. Left, unless it is set.
   */
  align?: ColumnAlign
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
  /**
   * Fit the table to the width it is given: the columns share that width,
   * every cell stays on one line, and a value too long for its column ends in
   * an ellipsis. Size the short columns with `className` and the rest divide
   * what is left.
   *
   * Without it the table keeps its natural width and scrolls sideways once it
   * outgrows the container, which is the right trade for a table of many
   * columns where nothing may be cut off.
   */
  fitWidth?: boolean
}

const HEADER_CLASS =
  'whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600'

const ALIGN_CLASS: Record<ColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

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
  fitWidth,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={fitWidth ? undefined : 'scrollbar-thin overflow-x-auto'}>
        <table
          className={cn(
            'w-full text-left text-sm',
            fitWidth ? 'table-fixed' : 'min-w-[640px]',
          )}
        >
          <thead>
            {/* A touch bolder and wider than the rows, on a slightly deeper
                band, so the header reads as a header without going dark. */}
            <tr className="border-b border-slate-200 bg-slate-100/80">
              {columns.map((col, i) => {
                const className = cn(
                  HEADER_CLASS,
                  ALIGN_CLASS[col.align ?? 'left'],
                  fitWidth && 'truncate',
                  col.className,
                )

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
                      className={cn(
                        'group inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-slate-900',
                        active && 'text-slate-900',
                      )}
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
                  {/* Under `fitWidth` a cell is held to one line and cut with
                      an ellipsis, so the row keeps the height of every other
                      row and the table never grows past its container. A
                      column may opt back out with `whitespace-normal`. */}
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={cn(
                        'px-4 py-3.5 align-middle text-slate-700',
                        ALIGN_CLASS[col.align ?? 'left'],
                        fitWidth && 'truncate',
                        col.className,
                      )}
                    >
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
