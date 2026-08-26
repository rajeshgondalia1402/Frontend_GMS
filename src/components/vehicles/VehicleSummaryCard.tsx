import { Car, Gauge } from 'lucide-react'
import type { VehicleSummary } from '@/types/vehicle'
import { VehicleStatusBadge } from './VehicleStatusBadge'

interface VehicleSummaryCardProps {
  vehicle: VehicleSummary
}

/**
 * One vehicle of the customer. The embedded vehicles from the customer fetch
 * carry fewer fields than a freshly created one, so everything past the number
 * and type is rendered only when it is there.
 */
export function VehicleSummaryCard({ vehicle }: VehicleSummaryCardProps) {
  const spec = [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(' ')
  const km = typeof vehicle.currentKm === 'number' ? vehicle.currentKm.toLocaleString('en-IN') : null

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Car className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{vehicle.vehicleNumber}</p>
          <p className="truncate text-sm text-slate-500">
            {spec || vehicle.description || vehicle.vehicleType}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{vehicle.vehicleType}</span>
            {vehicle.fuelType && <span>{vehicle.fuelType}</span>}
            {km && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" /> {km} km
              </span>
            )}
          </div>
        </div>
      </div>

      {vehicle.status && <VehicleStatusBadge status={vehicle.status} />}
    </div>
  )
}
