import { Car, ClipboardList, Clock } from 'lucide-react'
import { agoLabel, formatDate } from '@/lib/utils'
import type { VehicleSummary } from '@/types/vehicle'
import { VehicleChips, vehicleMakeModel } from './VehicleFacts'
import { VehicleStatusBadge } from './VehicleStatusBadge'

interface VehicleSummaryCardProps {
  vehicle: VehicleSummary
  /** Also show the complaint and when the vehicle last came in. */
  detailed?: boolean
}

/**
 * One vehicle of a customer, as a card: its number, make and status at the
 * top, its facts as chips, and — `detailed` — what it came in for and how long
 * ago. The customer fetch embeds a trimmed-down vehicle, so every fact is shown
 * only when it is there rather than as a dash.
 */
export function VehicleSummaryCard({ vehicle, detailed = false }: VehicleSummaryCardProps) {
  const makeModel = vehicleMakeModel(vehicle)
  // The type stands in for the make and model when those were not recorded,
  // and is then not repeated as a chip.
  const subtitle = makeModel || vehicle.vehicleType
  const complaint = vehicle.description?.trim()
  const lastVisit = agoLabel(vehicle.createdAt)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Car className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold tracking-wide text-slate-900">{vehicle.vehicleNumber}</p>
            {subtitle && <p className="break-words text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {vehicle.status && (
          <span className="shrink-0 whitespace-nowrap">
            <VehicleStatusBadge status={vehicle.status} />
          </span>
        )}
      </div>

      <div className="px-4 pb-3 empty:hidden">
        <VehicleChips vehicle={vehicle} skipType={!makeModel} />
      </div>

      {detailed && complaint && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <ClipboardList className="h-3.5 w-3.5" />
            Work Requested
          </p>
          <p className="whitespace-pre-line border-l-2 border-primary-200 pl-3 text-sm leading-relaxed text-slate-700">
            {complaint}
          </p>
        </div>
      )}

      {detailed && lastVisit && vehicle.createdAt && (
        // Pinned to the foot, so cards of different lengths end on one line.
        <p className="mt-auto flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Last visit <span className="font-semibold text-slate-700">{lastVisit}</span>
          <span className="text-slate-400">· {formatDate(vehicle.createdAt)}</span>
        </p>
      )}
    </div>
  )
}
