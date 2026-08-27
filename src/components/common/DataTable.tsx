import { Fragment } from 'react'
import type { ReactNode } from 'react'

export interface Column<T> {
  header: string
  accessor: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: (row: T) => string
  onRowClick?: (row: T) => void
  /** Full-width detail row rendered under a row while it is expanded. */
  renderExpanded?: (row: T) => ReactNode
  isExpanded?: (row: T) => boolean
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  renderExpanded,
  isExpanded,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            {/* A touch bolder and wider than the rows, on a slightly deeper
                band, so the header reads as a header without going dark. */}
            <tr className="border-b border-slate-200 bg-slate-100/80">
              {columns.map((col, i) => (
                <th key={i} className={`whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
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
