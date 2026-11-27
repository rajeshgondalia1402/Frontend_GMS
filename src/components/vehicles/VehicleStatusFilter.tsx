import { CheckCircle2, Clock, LayoutGrid, Wrench } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'
import { VEHICLE_STATUS_INFO } from '@/components/common/StatusHelp'
import type { VehicleStatus } from '@/types/vehicle'

interface VehicleStatusFilterProps {
  /** '' is "All". */
  value: VehicleStatus | ''
  /** Vehicles per status for the current search and period. */
  counts: Partial<Record<VehicleStatus, number>>
  onChange: (value: VehicleStatus | '') => void
  className?: string
}

interface Option {
  value: VehicleStatus | ''
  label: string
  icon: ComponentType<{ className?: string }>
  hint: string
  /** Colours when picked. */
  on: string
  /** Count bubble colours when not picked. */
  pill: string
}

const OPTIONS: Option[] = [
  {
    value: '',
    label: 'All',
    icon: LayoutGrid,
    hint: 'Every vehicle, whatever its status',
    on: 'border-slate-800 bg-slate-800 text-white',
    pill: 'bg-slate-100 text-slate-700',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    icon: Clock,
    hint: VEHICLE_STATUS_INFO.PENDING.meaning,
    on: 'border-amber-500 bg-amber-500 text-white',
    pill: 'bg-amber-100 text-amber-800',
  },
  {
    value: 'IN_SERVICE',
    label: 'In Service',
    icon: Wrench,
    hint: VEHICLE_STATUS_INFO.IN_SERVICE.meaning,
    on: 'border-sky-600 bg-sky-600 text-white',
    pill: 'bg-sky-100 text-sky-800',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    icon: CheckCircle2,
    hint: VEHICLE_STATUS_INFO.COMPLETED.meaning,
    on: 'border-emerald-600 bg-emerald-600 text-white',
    pill: 'bg-emerald-100 text-emerald-800',
  },
]

/**
 * One-tap status filter for the vehicle list — big coloured buttons with a
 * count on each, so the owner sees at a glance how many are waiting, in the
 * garage, or done, and taps straight to them. Scrolls sideways on a phone.
 */
export function VehicleStatusFilter({ value, counts, onChange, className }: VehicleStatusFilterProps) {
  const total = (counts.PENDING ?? 0) + (counts.IN_SERVICE ?? 0) + (counts.COMPLETED ?? 0)
  const hasCounts = Object.keys(counts).length > 0

  return (
    <div
      role="radiogroup"
      aria-label="Filter by vehicle status"
      className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0', className)}
    >
      {OPTIONS.map((o) => {
        const active = value === o.value
        const count = o.value ? counts[o.value] : total
        const Icon = o.icon
        return (
          <button
            key={o.value || 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
              active ? o.on : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            <Icon className="h-4 w-4" />
            {o.label}
            {hasCounts && (
              <span
                className={cn(
                  'min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs tabular-nums',
                  active ? 'bg-white/25 text-white' : o.pill,
                )}
              >
                {count ?? 0}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
