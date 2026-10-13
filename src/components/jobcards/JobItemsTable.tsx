import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { formatAmount, itemAmount } from '@/lib/jobCard'
import type { JobLineItem } from '@/types'

interface JobItemsTableProps {
  items: JobLineItem[]
  /** Inline edits — quantity and rate are changed straight in the row. */
  onPatch: (id: string, patch: Partial<Pick<JobLineItem, 'qty' | 'rate'>>) => void
  onEdit: (item: JobLineItem) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

const cellInput =
  'h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

const headCell = 'whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600'

/**
 * The billed lines of the job card. Narrower than the shared DataTable so the
 * row actions still fit beside the summary column on a laptop screen.
 */
export function JobItemsTable({ items, onPatch, onEdit, onRemove, onAdd }: JobItemsTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No services or items yet"
        description="Add the services, parts and labour carried out on this vehicle."
        action={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={onAdd}>
            Add Service / Item
          </Button>
        }
      />
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80">
                <th className={`${headCell} w-10`}>#</th>
                <th className={headCell}>Description</th>
                <th className={headCell}>Qty</th>
                <th className={headCell}>Rate (₹)</th>
                <th className={`${headCell} text-right`}>Amount (₹)</th>
                <th className={`${headCell} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">{item.description}</td>
                  <td className="px-3 py-3">
                    <QtyStepper value={item.qty} onChange={(qty) => onPatch(item.id, { qty })} />
                  </td>
                  <td className="px-3 py-3">
                    <RateInput value={item.rate} onChange={(rate) => onPatch(item.id, { rate })} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-900">
                    {formatAmount(itemAmount(item))}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <RowActions item={item} onEdit={onEdit} onRemove={onRemove} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="mr-1.5 text-slate-400">{index + 1}.</span>
                  {item.description}
                </p>
              </div>
              <RowActions item={item} onEdit={onEdit} onRemove={onRemove} />
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-xs font-medium text-slate-500">
                Qty
                <span className="mt-1 block">
                  <QtyStepper value={item.qty} onChange={(qty) => onPatch(item.id, { qty })} />
                </span>
              </label>
              <label className="text-xs font-medium text-slate-500">
                Rate (₹)
                <span className="mt-1 block">
                  <RateInput value={item.rate} onChange={(rate) => onPatch(item.id, { rate })} />
                </span>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-500">Amount</span>
              <span className="text-base font-semibold text-slate-900">₹{formatAmount(itemAmount(item))}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function RowActions({
  item,
  onEdit,
  onRemove,
}: {
  item: JobLineItem
  onEdit: (item: JobLineItem) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onEdit(item)}
        aria-label={`Edit ${item.description}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-600 transition-colors hover:bg-primary-50"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.description}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function QtyStepper({ value, onChange }: { value: number; onChange: (qty: number) => void }) {
  const step = (delta: number) => onChange(Math.max(1, value + delta))

  return (
    <div className="relative w-[76px]">
      <input
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        aria-label="Quantity"
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className={`${cellInput} w-full pr-6`}
      />
      <span className="absolute right-1 top-1/2 flex -translate-y-1/2 flex-col">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase quantity"
          onClick={() => step(1)}
          className="flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:text-slate-700"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease quantity"
          onClick={() => step(-1)}
          className="flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:text-slate-700"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </span>
    </div>
  )
}

function RateInput({ value, onChange }: { value: number; onChange: (rate: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      inputMode="decimal"
      aria-label="Rate"
      value={value}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className={`${cellInput} w-[96px]`}
    />
  )
}
