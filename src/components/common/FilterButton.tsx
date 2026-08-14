import { cn } from '@/lib/utils'

interface FilterButtonProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}

export function FilterButton({ options, value, onChange }: FilterButtonProps) {
  return (
    <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            value === o.value
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
