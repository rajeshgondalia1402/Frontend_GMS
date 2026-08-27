import { Car, Gauge } from 'lucide-react'
import type { VehicleSummary } from '@/types/vehicle'
import { VehicleStatusBadge } from './VehicleStatusBadge'

interface VehicleSummaryCardProps {
  vehicle: VehicleSummary
  /** Also list every stored field under the header. */
  detailed?: boolean
}

interface FieldProps {
  label: string
  value?: string | number | null
}

/** One stored field. The customer fetch embeds a trimmed-down vehicle, so a
 *  field it leaves out — `currentKm` and `description` among them — reads as
 *  a dash rather than disappearing. */
function Field({ label, value }: FieldProps) {
  const shown = value === 0 ? '0' : value || ''

  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`break-words text-sm ${shown ? 'text-slate-700' : 'text-slate-400'}`}>
        {shown || '—'}
      </p>
    </div>
  )
}

/**
 * One vehicle of the customer. The embedded vehicles from the customer fetch
 * carry fewer fields than a freshly created one, so everything past the number
 * and type is rendered only when it is there.
 */
export function VehicleSummaryCard({ vehicle, detailed = false }: VehicleSummaryCardProps) {
  const spec = [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(' ')
  const km = typeof vehicle.currentKm === 'number' ? vehicle.currentKm.toLocaleString('en-IN') : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Car className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{vehicle.vehicleNumber}</p>
            <p className="truncate text-sm text-slate-500">
              {spec || vehicle.description || vehicle.vehicleType}
            </p>
            {!detailed && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{vehicle.vehicleType}</span>
                {vehicle.fuelType && <span>{vehicle.fuelType}</span>}
                {km && (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" /> {km} km
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {vehicle.status && <VehicleStatusBadge status={vehicle.status} />}
      </div>

      {detailed && (
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 xl:grid-cols-4">
          <Field label="Type" value={vehicle.vehicleType} />
          <Field label="Brand" value={vehicle.brand} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Variant" value={vehicle.variant} />
          <Field label="Fuel Type" value={vehicle.fuelType} />
          <Field label="Colour" value={vehicle.color} />
          <Field label="Current KM" value={km} />
          <Field label="Insurance Expiry" value={vehicle.insuranceExpiry} />
          <Field label="Description" value={vehicle.description} />
        </div>
      )}
    </div>
  )
}
