import type { ReactNode } from 'react'
import type { Column } from './DataTable'
import { DataTable } from './DataTable'

interface ResponsiveListProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: (row: T) => string
  renderCard: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  /** Detail block shown under the row (or card) while it is expanded. */
  renderExpanded?: (row: T) => ReactNode
  isExpanded?: (row: T) => boolean
}

/** Table on desktop (lg+), stacked cards on mobile. */
export function ResponsiveList<T>({
  columns,
  data,
  keyField,
  renderCard,
  onRowClick,
  renderExpanded,
  isExpanded,
}: ResponsiveListProps<T>) {
  return (
    <>
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={data}
          keyField={keyField}
          onRowClick={onRowClick}
          renderExpanded={renderExpanded}
          isExpanded={isExpanded}
        />
      </div>
      <div className="space-y-3 lg:hidden">
        {data.map((row) => (
          <div key={keyField(row)}>
            {renderCard(row)}
            {renderExpanded && isExpanded?.(row) && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {renderExpanded(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
