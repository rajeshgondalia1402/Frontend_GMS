import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { SearchInput } from '@/components/common'
import { cn } from '@/lib/utils'

export interface PickerOption {
  id: string
  title: string
  subtitle?: string
  /** Right-aligned detail, e.g. the fuel the vehicle runs on. */
  meta?: string
}

interface RecordPickerModalProps {
  open: boolean
  title: string
  searchPlaceholder: string
  options: PickerOption[]
  selectedId?: string
  emptyLabel: string
  /** Shown in place of the list while the records are still being fetched. */
  loading?: boolean
  /** Shown in place of the list when they could not be fetched. */
  error?: string | null
  onSelect: (option: PickerOption) => void
  onClose: () => void
}

/**
 * The full list of saved records, to be read rather than recalled — the desk
 * opens it when it cannot name the vehicle it is looking for, and narrows it
 * with the search box only if the list is long.
 */
export function RecordPickerModal({
  open,
  title,
  searchPlaceholder,
  options,
  selectedId,
  emptyLabel,
  loading = false,
  error = null,
  onSelect,
  onClose,
}: RecordPickerModalProps) {
  const [query, setQuery] = useState('')

  // Every visit starts from the full list rather than the last search.
  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((o) =>
      [o.title, o.subtitle, o.meta].some((field) => field?.toLowerCase().includes(needle)),
    )
  }, [options, query])

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <SearchInput value={query} onChange={setQuery} placeholder={searchPlaceholder} className="mb-3" />

      {loading ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="scrollbar-thin max-h-[50vh] space-y-2 overflow-y-auto pb-1">
          {filtered.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                option.id === selectedId
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-slate-200 hover:bg-slate-50',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{option.title}</span>
                {option.subtitle && (
                  <span className="block truncate font-mono text-sm text-slate-500">{option.subtitle}</span>
                )}
              </span>
              {option.meta && <span className="shrink-0 text-xs text-slate-500">{option.meta}</span>}
              {option.id === selectedId && <Check className="h-4 w-4 shrink-0 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
