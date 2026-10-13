import { Badge } from '@/components/ui'
import { vehicleStatusLabel, vehicleStatusTone } from '@/lib/vehicleStatus'
import type { VehicleStatus } from '@/types/vehicle'

interface VehicleStatusBadgeProps {
  status?: VehicleStatus
}

/** The vehicle's status, or a dash where the API sent none. */
export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  if (!status) return <span className="text-slate-400">—</span>

  return <Badge tone={vehicleStatusTone(status)}>{vehicleStatusLabel(status)}</Badge>
}
