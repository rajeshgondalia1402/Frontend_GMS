import type { ReactNode } from 'react'
import type { Column } from './DataTable'
import { DataTable } from './DataTable'

interface ResponsiveListProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: (row: T) => string
  renderCard: (row: T) => ReactNode
  onRowClick?: (row: T) => void
}

/** Table on desktop (lg+), stacked cards on mobile. */
export function ResponsiveList<T>({ columns, data, keyField, renderCard, onRowClick }: ResponsiveListProps<T>) {
  return (
    <>
      <div className="hidden lg:block">
        <DataTable columns={columns} data={data} keyField={keyField} onRowClick={onRowClick} />
      </div>
      <div className="space-y-3 lg:hidden">
        {data.map((row) => (
          <div key={keyField(row)}>{renderCard(row)}</div>
        ))}
      </div>
    </>
  )
}
