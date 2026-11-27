import { Badge, StatusTooltip } from '@/components/ui'
import { VehicleStatusHelp } from '@/components/common/StatusHelp'
import { vehicleStatusLabel, vehicleStatusTone } from '@/lib/vehicleStatus'
import type { VehicleStatus } from '@/types/vehicle'

interface VehicleStatusBadgeProps {
  status?: VehicleStatus
  /** Leave the explanation bubble off, e.g. inside another button. */
  noHint?: boolean
}

/** The vehicle's status — with a bubble explaining it — or a dash where the API sent none. */
export function VehicleStatusBadge({ status, noHint = false }: VehicleStatusBadgeProps) {
  if (!status) return <span className="text-slate-400">—</span>

  const label = vehicleStatusLabel(status)
  const badge = <Badge tone={vehicleStatusTone(status)}>{label}</Badge>
  if (noHint) return badge

  return (
    <StatusTooltip
      label={`What does vehicle status ${label} mean?`}
      content={<VehicleStatusHelp status={status} />}
    >
      {badge}
    </StatusTooltip>
  )
}
