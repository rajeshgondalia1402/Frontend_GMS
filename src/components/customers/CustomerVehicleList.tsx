import { VehicleStatusBadge } from '@/components/vehicles'
import type { VehicleSummary } from '@/types/vehicle'

const HEADERS = ['Vehicle Number', 'Type', 'Brand', 'Model', 'Status']

interface CustomerVehicleListProps {
  vehicles: VehicleSummary[]
}

/** The vehicles of one customer, shown when their row is expanded. */
export function CustomerVehicleList({ vehicles }: CustomerVehicleListProps) {
  if (vehicles.length === 0) {
    return <p className="text-sm text-slate-500">No vehicles for this customer yet.</p>
  }

  return (
    <>
      {/* Table from sm up, where five columns still fit comfortably. */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                  {vehicle.vehicleNumber}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{vehicle.vehicleType || '—'}</td>
                <td className="px-3 py-2.5 text-slate-700">{vehicle.brand || '—'}</td>
                <td className="px-3 py-2.5 text-slate-700">{vehicle.model || '—'}</td>
                <td className="px-3 py-2.5">
                  <VehicleStatusBadge status={vehicle.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked on the narrowest screens, so nothing scrolls sideways. */}
      <div className="space-y-2 sm:hidden">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{vehicle.vehicleNumber}</p>
              <VehicleStatusBadge status={vehicle.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[vehicle.vehicleType, vehicle.brand, vehicle.model].filter(Boolean).join(' · ') ||
                '—'}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
